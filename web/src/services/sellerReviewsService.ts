import { apiClient } from '../lib/apiClient';

export interface ReviewPhotoItem {
  id: number;
  image: string;
  created_at: string;
}

export interface ReviewReplyItem {
  id: number;
  text: string;
  author_name: string;
  created_at: string;
  updated_at: string;
}

export interface StoreReviewItem {
  id: number;
  order_item: number;
  rating: number;
  comment: string;
  photos: ReviewPhotoItem[];
  reply?: ReviewReplyItem | null;
  author_name: string;
  product_name: string;
  product_image?: string | null;
  volume_ml?: number | null;
  order_id?: number | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreReviewsSummary {
  count: number;
  average: number;
  distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface StoreReviewsResponse {
  summary: StoreReviewsSummary;
  results: StoreReviewItem[];
}

export interface ReviewFilterParams {
  product?: string | number;
  rating?: string | number;
  with_photos?: boolean;
  unanswered?: boolean;
  ordering?: string;
}

export const sellerReviewsService = {
  getStoreReviews: async (params?: ReviewFilterParams): Promise<StoreReviewsResponse> => {
    const queryParams: Record<string, any> = {};
    if (params?.product) queryParams.product = params.product;
    if (params?.rating) queryParams.rating = params.rating;
    if (params?.with_photos) queryParams.with_photos = 'true';
    if (params?.unanswered) queryParams.unanswered = 'true';
    if (params?.ordering) queryParams.ordering = params.ordering;

    const response = await apiClient.get<StoreReviewsResponse>('/store/reviews/', {
      params: queryParams,
    });
    return response.data;
  },

  replyToReview: async (reviewId: number, text: string): Promise<ReviewReplyItem> => {
    const response = await apiClient.put<ReviewReplyItem>(`/store/reviews/${reviewId}/reply/`, {
      text,
    });
    return response.data;
  },
};
