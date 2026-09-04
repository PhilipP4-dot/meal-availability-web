export type Meal = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  ingredients: string[];
  recipe: string[];
  available: boolean;
  imageKey?: string;
};

export const seedMeals: Meal[] = [
  {
    id: 1,
    name: "Nigerian jollof rice & chicken",
    description: "Smoky tomato-pepper rice served with seasoned roasted chicken and fried plantain.",
    price: 18,
    category: "Nigerian",
    ingredients: ["Long-grain rice", "Chicken", "Tomatoes", "Red bell peppers", "Scotch bonnet", "Onion", "Plantain", "Thyme"],
    recipe: ["Tomatoes, peppers, and onion are blended and cooked down into a rich stew.", "Rice simmers in the seasoned stew until smoky and tender.", "Served with roasted chicken and sweet fried plantain."],
    available: true,
  },
  {
    id: 2,
    name: "Waakye with stew",
    description: "Ghanaian rice and beans with tomato stew, gari, spaghetti, and ripe plantain.",
    price: 17,
    category: "Ghanaian",
    ingredients: ["Rice", "Black-eyed peas", "Tomatoes", "Onion", "Gari", "Spaghetti", "Plantain", "Dried sorghum leaves"],
    recipe: ["Black-eyed peas and rice are cooked together with sorghum leaves.", "A deeply seasoned tomato and onion stew is prepared separately.", "Served with gari, spaghetti, and fried ripe plantain."],
    available: true,
  },
  {
    id: 3,
    name: "Chicken yassa",
    description: "Senegalese citrus-marinated chicken with caramelized onions and broken rice.",
    price: 19,
    category: "Senegalese",
    ingredients: ["Chicken", "Onions", "Lemon", "Dijon mustard", "Garlic", "Scotch bonnet", "Broken rice"],
    recipe: ["Chicken marinates with lemon, mustard, garlic, and onions.", "The chicken is browned while the onions cook down until soft and deeply flavored.", "Finished together in the onion sauce and served over rice."],
    available: false,
  },
];
