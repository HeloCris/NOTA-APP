import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  sellerReviewsService,
  type StoreReviewItem,
  type StoreReviewsSummary,
} from '../../services/sellerReviewsService';
import type { Store } from '../../types/store';

interface StoreReviewsViewProps {
  store: Store | null;
  onBack?: () => void;
}

export function StoreReviewsView({ store, onBack }: StoreReviewsViewProps) {
  const [reviews, setReviews] = useState<StoreReviewItem[]>([]);
  const [summary, setSummary] = useState<StoreReviewsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filtros
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [withPhotosOnly, setWithPhotosOnly] = useState<boolean>(false);
  const [unansweredOnly, setUnansweredOnly] = useState<boolean>(false);

  // Dropdowns
  const [showRatingDropdown, setShowRatingDropdown] = useState<boolean>(false);
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  // Foto expandida
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Resposta do lojista
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [isSubmittingReply, setIsSubmittingReply] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    sellerReviewsService
      .getStoreReviews({
        rating: selectedRating ?? undefined,
        product: selectedProduct ?? undefined,
        with_photos: withPhotosOnly || undefined,
        unanswered: unansweredOnly || undefined,
      })
      .then((data) => {
        if (!isMounted) return;
        setReviews(data.results || []);
        setSummary(data.summary || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Erro ao carregar avaliações do lojista:', err);
        toast.error('Não foi possível carregar as avaliações.');
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedRating, selectedProduct, withPhotosOnly, unansweredOnly]);

  // Perfumes únicos encontrados nas avaliações para popular o filtro
  const availablePerfumes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of reviews) {
      if (r.product_name) {
        map.set(r.product_name, (map.get(r.product_name) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
  }, [reviews]);

  // Formatação de data
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Formatação de volumetria (≤15ml = Decant)
  const formatVol = (vol?: number | null) => {
    if (!vol) return '';
    return vol <= 15 ? `Decant ${vol}ml` : `${vol}ml`;
  };

  // Submissão de resposta do lojista
  const handleSendReply = async (reviewId: number) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      const reply = await sellerReviewsService.replyToReview(reviewId, replyText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, reply } : r))
      );
      toast.success('Resposta enviada com sucesso!');
      setReplyingToId(null);
      setReplyText('');
    } catch {
      toast.error('Erro ao enviar resposta.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const totalReviews = summary?.count ?? reviews.length;
  const avgRating = (summary?.average ?? 0).toFixed(1).replace('.', ',');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header com Botão Voltar Discreto e Ícone Oficial */}
      <div>
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Voltar para Visão Geral"
              className="w-9 h-9 rounded-full bg-white border border-[#E6E1D2] hover:bg-[#F5F3E9] text-[#354B5E] flex items-center justify-center transition-colors cursor-pointer shadow-xs flex-shrink-0"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          )}
          <h1 className="text-[27px] font-extrabold text-[#263847] tracking-[-0.01em] font-jakarta flex items-center gap-2">
            Avaliações da Loja
            {store?.is_official && (
              <span title="Loja Oficial" className="inline-flex items-center">
                <svg className="w-5 h-5 text-[#1D9BF0] flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.733 2.73 1.83 3.395-.084.288-.13.593-.13.905 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25C8.98 21.585 10.29 22.5 11.8 22.5c1.51 0 2.818-.915 3.338-2.25.416.165.866.25 1.336.25 2.21 0 3.918-1.79 3.918-4 0-.312-.046-.617-.13-.905 1.097-.665 1.83-1.935 1.83-3.395zM10.98 16.99L7.22 13.23l1.96-1.96 1.8 1.8 5.8-5.8 1.96 1.96-7.76 7.76z"/>
                </svg>
              </span>
            )}
          </h1>
        </div>
        <p className="text-[13px] text-[#5A6067] mt-1">
          Acompanhe a opinião dos clientes, avaliações por produto e responda feedbacks diretamente.
        </p>
      </div>

      {/* Card Resumo com Média e Distribuição de Estrelas */}
      <div className="bg-white border border-[#EFEBDD] rounded-[22px] p-7 shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col md:flex-row items-center gap-10">
        <div className="flex flex-col items-center justify-center min-w-[180px] border-b md:border-b-0 md:border-r border-[#EFEBDD] pb-6 md:pb-0 md:pr-10">
          <span className="text-[52px] font-extrabold text-[#1C252E] font-jakarta leading-none tracking-tight">
            {avgRating}
          </span>
          <div className="flex items-center gap-1.5 my-2.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(summary?.average ?? 0)
                    ? 'text-[#F59E0B]'
                    : 'text-[#E5E7EB]'
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[13px] font-bold text-[#78716C]">
            {totalReviews} {totalReviews === 1 ? 'avaliação no total' : 'avaliações no total'}
          </span>
        </div>

        {/* Barras de distribuição */}
        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary?.distribution?.[String(stars) as keyof typeof summary.distribution] ?? 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3.5 text-[13px]">
                <span className="w-12 font-bold text-[#5A6067] flex items-center gap-1">
                  {stars} <span className="text-[#F59E0B]">★</span>
                </span>
                <div className="flex-1 h-2.5 bg-[#F0EDE3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2C4659] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right font-bold text-[#93927F]">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros Alinhados */}
      <div className="bg-white border border-[#EFEBDD] rounded-[18px] p-4.5 shadow-[0_1px_3px_rgba(35,40,45,0.06)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#93927F]">
            Filtrar Por:
          </span>

          {/* Botão Dropdown Estrelas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRatingDropdown(!showRatingDropdown);
                setShowProductDropdown(false);
              }}
              className={`px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedRating !== null
                  ? 'bg-[#2C4659] text-white border-[#2C4659]'
                  : 'bg-[#F9F8F3] hover:bg-[#EFECE1] text-[#354B5E] border-[#E6E1D2]'
              }`}
            >
              <span>★ {selectedRating ? `${selectedRating} Estrelas` : 'Estrelas'}</span>
              <span className="text-[9px]">▼</span>
            </button>

            {showRatingDropdown && (
              <div className="absolute left-0 mt-2 w-48 bg-white border border-[#E6E1D2] rounded-xl shadow-xl z-20 py-1.5">
                <button
                  onClick={() => {
                    setSelectedRating(null);
                    setShowRatingDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-[#5A6067] hover:bg-[#F5F3E9] cursor-pointer"
                >
                  Todas as estrelas
                </button>
                {[5, 4, 3, 2, 1].map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedRating(st);
                      setShowRatingDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-[12.5px] font-semibold flex items-center justify-between hover:bg-[#F5F3E9] cursor-pointer ${
                      selectedRating === st ? 'text-[#2C4659] font-bold bg-[#F9F8F3]' : 'text-[#23282D]'
                    }`}
                  >
                    <span>{st} Estrelas</span>
                    <span className="text-[#F59E0B]">{'★'.repeat(st)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botão Dropdown Perfumes */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowProductDropdown(!showProductDropdown);
                setShowRatingDropdown(false);
              }}
              className={`px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer max-w-[220px] truncate ${
                selectedProduct
                  ? 'bg-[#2C4659] text-white border-[#2C4659]'
                  : 'bg-[#F9F8F3] hover:bg-[#EFECE1] text-[#354B5E] border-[#E6E1D2]'
              }`}
            >
              <span className="truncate">🧪 {selectedProduct || 'Perfumes'}</span>
              <span className="text-[9px]">▼</span>
            </button>

            {showProductDropdown && (
              <div className="absolute left-0 mt-2 w-72 max-h-60 overflow-y-auto bg-white border border-[#E6E1D2] rounded-xl shadow-xl z-20 py-1.5">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setShowProductDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-[12.5px] font-semibold text-[#5A6067] hover:bg-[#F5F3E9] cursor-pointer"
                >
                  Todos os perfumes
                </button>
                {availablePerfumes.length === 0 ? (
                  <div className="px-4 py-2 text-[12px] text-[#93927F]">Nenhum perfume específico</div>
                ) : (
                  availablePerfumes.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSelectedProduct(p.name);
                        setShowProductDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[12.5px] font-semibold flex items-center justify-between hover:bg-[#F5F3E9] cursor-pointer ${
                        selectedProduct === p.name ? 'text-[#2C4659] font-bold bg-[#F9F8F3]' : 'text-[#23282D]'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[11px] text-[#78716C] ml-2 font-bold">({p.count})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Chip Com Fotos */}
          <button
            type="button"
            onClick={() => setWithPhotosOnly(!withPhotosOnly)}
            className={`px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              withPhotosOnly
                ? 'bg-[#2C4659] text-white border-[#2C4659]'
                : 'bg-[#F9F8F3] hover:bg-[#EFECE1] text-[#354B5E] border-[#E6E1D2]'
            }`}
          >
            <span>📷 Com fotos</span>
          </button>

          {/* Chip Não Respondidas */}
          <button
            type="button"
            onClick={() => setUnansweredOnly(!unansweredOnly)}
            className={`px-3.5 py-2 rounded-full text-[12.5px] font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              unansweredOnly
                ? 'bg-[#A85A38] text-white border-[#A85A38]'
                : 'bg-[#F9F8F3] hover:bg-[#EFECE1] text-[#7E4228] border-[#E6E1D2]'
            }`}
          >
            <span>💬 Sem resposta</span>
          </button>
        </div>

        {/* Limpar Filtros */}
        {(selectedRating !== null || selectedProduct !== null || withPhotosOnly || unansweredOnly) && (
          <button
            onClick={() => {
              setSelectedRating(null);
              setSelectedProduct(null);
              setWithPhotosOnly(false);
              setUnansweredOnly(false);
            }}
            className="text-[12.5px] font-bold text-[#A85A38] hover:underline cursor-pointer"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista de Avaliações em Tela Inteira */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white border border-[#EFEBDD] rounded-[22px]">
          <div className="w-9 h-9 border-3 border-[#2C4659] border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-[#78716C] font-semibold">Carregando avaliações...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E6E1D2] rounded-[22px] py-16 px-6 text-center">
          <div className="w-14 h-14 bg-[#F5F3E9] text-[#2C4659] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-[18px] font-bold text-[#1C252E]">Nenhuma avaliação encontrada</h3>
          <p className="text-[13.5px] text-[#78716C] mt-1 max-w-sm mx-auto">
            Não há avaliações registradas com estes filtros para a sua loja.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-[#EFEBDD] rounded-[20px] p-6 shadow-[0_1px_3px_rgba(35,40,45,0.06)] space-y-4"
            >
              {/* Topo da Avaliação */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-[#E9EDF0] text-[#2C4659] flex items-center justify-center font-bold text-[15px]">
                    {rev.author_name ? rev.author_name.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-[#1C252E]">
                        {rev.author_name || 'Cliente Verificado'}
                      </span>
                      <span className="bg-[#EDF5EC] text-[#2D6A4F] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full">
                        Compra Verificada
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((st) => (
                          <svg
                            key={st}
                            className={`w-4 h-4 ${
                              st <= rev.rating ? 'text-[#F59E0B]' : 'text-[#E5E7EB]'
                            }`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[12px] text-[#93927F]">
                        • {formatDate(rev.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variação e Perfume */}
              {(rev.product_name || rev.volume_ml) && (
                <div className="inline-flex items-center gap-2 bg-[#F7F5EE] border border-[#EBE7DC] px-3 py-1.5 rounded-lg text-[12px] text-[#5A6067] font-semibold">
                  <span>🧪 {rev.product_name}</span>
                  {rev.volume_ml && <span>• {formatVol(rev.volume_ml)}</span>}
                </div>
              )}

              {/* Comentário */}
              {rev.comment && (
                <p className="text-[14px] text-[#2C3E50] leading-relaxed">
                  {rev.comment}
                </p>
              )}

              {/* Fotos Anexadas */}
              {rev.photos && rev.photos.length > 0 && (
                <div className="flex gap-2.5 pt-1">
                  {rev.photos.map((p) => (
                    <img
                      key={p.id}
                      src={p.image}
                      alt="Foto da avaliação"
                      onClick={() => setSelectedPhoto(p.image)}
                      className="w-20 h-20 rounded-xl object-cover border border-[#E6E1D2] hover:opacity-90 cursor-pointer transition-opacity"
                    />
                  ))}
                </div>
              )}

              {/* Resposta do Lojista */}
              {rev.reply ? (
                <div className="mt-3 bg-[#F4F1EA] border border-[#E4DFD3] rounded-xl p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-bold text-[#2C4659]">
                      Resposta de {rev.reply.author_name || store?.name || 'Sua Loja'}:
                    </span>
                    <span className="text-[#93927F]">
                      {formatDate(rev.reply.created_at)}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#4A5568] leading-relaxed">
                    {rev.reply.text}
                  </p>
                </div>
              ) : (
                /* Caixa para Responder */
                <div className="pt-2">
                  {replyingToId === rev.id ? (
                    <div className="space-y-2.5 bg-[#F9F8F4] border border-[#EBE7DD] rounded-xl p-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Escreva sua resposta cordial para o cliente..."
                        maxLength={1000}
                        rows={3}
                        className="w-full text-[13.5px] bg-white border border-[#DDD7C9] rounded-lg p-3 text-[#23282D] focus:outline-none focus:ring-1 focus:ring-[#2C4659]"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-[#93927F]">
                          {replyText.length}/1000 caracteres
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            className="px-3.5 py-1.5 text-[12.5px] font-bold text-[#5A6067] hover:bg-[#EAE6DB] rounded-lg transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingReply || !replyText.trim()}
                            onClick={() => handleSendReply(rev.id)}
                            className="px-4.5 py-1.5 text-[12.5px] font-bold bg-[#2C4659] text-white hover:bg-[#1E3240] rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {isSubmittingReply ? 'Enviando...' : 'Publicar Resposta'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToId(rev.id);
                        setReplyText('');
                      }}
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#2C4659] hover:underline cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Responder avaliação
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox para Foto Expandida */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="Foto expandida"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
