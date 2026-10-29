"""
Persistent Vector Store Service using ChromaDB.
Handles embedding generation, persistent collection indexing, and metadata-filtered retrieval.
"""

import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from backend.config import settings

class VectorStore:
    def __init__(self, persist_dir: Optional[str] = None):
        self.persist_dir = persist_dir or settings.CHROMA_PERSIST_DIR
        os.makedirs(self.persist_dir, exist_ok=True)

        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection_name = "outlookiq_financial_documents"
        self._collection = None

    @property
    def collection(self):
        if self._collection is None:
            self._collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
        return self._collection

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Add chunked documents to ChromaDB.
        Deduplicates by chunk ID and preserves financial metadata.
        """
        if not chunks:
            return 0

        ids = [c["chunk_id"] for c in chunks]
        documents = [c["text"] for c in chunks]
        metadatas = []

        for c in chunks:
            raw_meta = c.get("metadata", {})
            # Chroma metadata must only contain strings, ints, floats, or bools
            clean_meta = {}
            for k, v in raw_meta.items():
                if isinstance(v, (str, int, float, bool)):
                    clean_meta[k] = v
                elif v is not None:
                    clean_meta[k] = str(v)
            metadatas.append(clean_meta)

        self.collection.upsert(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )
        return len(chunks)

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        company_id: Optional[str] = None,
        fiscal_year: Optional[str] = None,
        doc_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform semantic similarity search with optional metadata filters.
        """
        where_filter = {}
        conditions = []

        if company_id and company_id != "ALL":
            conditions.append({"company_id": company_id})
        if fiscal_year and fiscal_year != "ALL":
            conditions.append({"fiscal_year": str(fiscal_year)})
        if doc_type and doc_type != "ALL":
            conditions.append({"document_type": doc_type})

        if len(conditions) == 1:
            where_filter = conditions[0]
        elif len(conditions) > 1:
            where_filter = {"$and": conditions}
        else:
            where_filter = None

        count = self.collection.count()
        if count == 0:
            return []

        actual_n = min(n_results, count)

        query_params = {
            "query_texts": [query_text],
            "n_results": actual_n
        }
        if where_filter:
            query_params["where"] = where_filter

        results = self.collection.query(**query_params)

        formatted = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            ids = results["ids"][0] if "ids" in results else [""] * len(docs)

            for i in range(len(docs)):
                formatted.append({
                    "id": ids[i],
                    "text": docs[i],
                    "metadata": metas[i],
                    "distance": distances[i],
                    # Cosine distance to similarity percentage
                    "similarity": round(max(0.0, 1.0 - distances[i]) * 100, 1) if distances else 90.0
                })

        return formatted

    def delete_by_document_id(self, doc_id: str):
        """Remove all chunks belonging to a specific document."""
        self.collection.delete(where={"doc_id": doc_id})

    def count(self) -> int:
        """Return total number of indexed vectors."""
        return self.collection.count()

# Global vector store instance
vector_store = VectorStore()
