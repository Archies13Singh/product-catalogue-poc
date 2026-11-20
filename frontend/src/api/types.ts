// The shapes our backend returns. These mirror the backend's own Product model, not the
// model of whichever data source the backend uses.

export interface Category {
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  rating: {
    score: number;
    count: number;
  };
}

export interface CategoryPage {
  category: Category;
  topRated: Product[];
  others: Product[];
}
