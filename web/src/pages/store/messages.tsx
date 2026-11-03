import { useNavigate } from "react-router-dom";

import { SvgDefs } from "../../components/seller/SvgDefs";
import { StoreMessages } from "../../features/store/StoreMessages";

export function StoreMessagesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-canvas font-inter">
      <SvgDefs />
      <div className="max-w-[1420px] mx-auto px-5 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-[12px] font-bold text-[#354B5E] hover:underline cursor-pointer"
            >
              Voltar
            </button>
            <h1 className="font-jakarta text-[27px] font-extrabold text-[#263847] mt-1">
              Mensagens
            </h1>
            <p className="text-[13px] text-[#5A6067]">
              Converse com seus clientes e acompanhe o contexto dos pedidos.
            </p>
          </div>
        </div>

        <StoreMessages />
      </div>
    </div>
  );
}
