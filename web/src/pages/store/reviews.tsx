import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreReviewsView } from "../../components/seller/StoreReviewsView";
import { storeService } from "../../services/storeService";
import type { Store } from "../../types/store";

export function StoreReviewsPage() {
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);

  useEffect(() => {
    storeService.getStoreMe()
      .then((data) => setStore(data))
      .catch((err) => {
        console.error("Erro ao carregar dados da loja:", err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <StoreReviewsView
          store={store}
          onBack={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
