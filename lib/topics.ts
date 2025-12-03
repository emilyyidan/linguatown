import { DifficultyLevel } from "./progress";

export interface Topic {
  id: string;
  name: string;
  description: string;
}

export type TopicsByLocation = Record<string, Record<DifficultyLevel, Topic[]>>;

export const topics: TopicsByLocation = {
  bakery: {
    beginner: [
      { id: "buying-bread", name: "Buying Bread", description: "Purchase bread from the bakery" },
      { id: "asking-price", name: "Asking for Price", description: "Inquire about the cost of items" },
      { id: "ordering-coffee-pastry", name: "Ordering Coffee and Pastry", description: "Order a coffee and pastry combination" },
      { id: "picking-up-order", name: "Picking Up an Order", description: "Collect a pre-placed order" },
      { id: "out-of-stock-substitution", name: "Out-of-Stock Substitution", description: "Find an alternative when an item is unavailable" },
    ],
    intermediate: [
      { id: "party-catering", name: "Party Catering Order", description: "Order baked goods for a birthday, office party, or gathering" },
      { id: "custom-decorations", name: "Custom Decorations", description: "Discuss customization options for special occasion cakes" },
      { id: "dietary-restrictions", name: "Dietary Restrictions", description: "Find baked goods that accommodate dietary needs" },
      { id: "bulk-order", name: "Bulk Order Planning", description: "Plan a large order for an event with multiple preferences" },
      { id: "flavor-consultation", name: "Flavor Consultation", description: "Get recommendations on flavors and combinations for your event" },
    ],
    advanced: [
      { id: "baking-techniques", name: "Baking Techniques", description: "Discuss professional baking methods and techniques" },
      { id: "recipe-development", name: "Recipe Development", description: "Talk about creating and refining recipes" },
      { id: "ingredient-sourcing", name: "Ingredient Sourcing", description: "Discuss where to find quality ingredients and suppliers" },
      { id: "baking-mistakes", name: "Common Baking Mistakes", description: "Learn about common pitfalls and how to avoid them" },
      { id: "baking-philosophy", name: "Baking Philosophy", description: "Share perspectives on the art and science of baking" },
    ],
  },
  bank: {
    beginner: [
      { id: "opening-account", name: "Opening an Account", description: "Start a new bank account" },
      { id: "withdrawing-money", name: "Withdrawing Money", description: "Take money out from your account" },
      { id: "asking-hours", name: "Asking About Hours", description: "Find out when the bank is open" },
      { id: "help-with-card", name: "Getting Help with a Card", description: "Get assistance with your bank card" },
      { id: "exchanging-money", name: "Exchanging Money", description: "Exchange currency at the bank" },
    ],
    intermediate: [
      { id: "account-types", name: "Comparing Account Types", description: "Learn about different account options and their benefits" },
      { id: "savings-goals", name: "Savings Goals Planning", description: "Discuss your financial goals and savings strategies" },
      { id: "loan-inquiry", name: "Loan Inquiry", description: "Explore loan options for personal or business needs" },
      { id: "credit-building", name: "Building Credit", description: "Get advice on improving your credit score" },
      { id: "financial-planning", name: "Basic Financial Planning", description: "Plan for short-term and medium-term financial goals" },
    ],
    advanced: [
      { id: "investment-strategies", name: "Investment Strategies", description: "Discuss investment approaches and portfolio management" },
      { id: "retirement-planning", name: "Retirement Planning", description: "Plan for long-term retirement and financial security" },
      { id: "risk-tolerance", name: "Risk Assessment", description: "Evaluate your risk tolerance and investment preferences" },
      { id: "tax-strategies", name: "Tax Strategies", description: "Discuss tax-efficient financial planning approaches" },
      { id: "financial-philosophy", name: "Financial Philosophy", description: "Share perspectives on wealth management and financial goals" },
    ],
  },
  hotel: {
    beginner: [
      { id: "checking-in", name: "Checking In", description: "Register and get your room key" },
      { id: "asking-wifi", name: "Asking for Wi-Fi", description: "Get the Wi-Fi password" },
      { id: "asking-towels", name: "Asking for Towels", description: "Request extra towels for your room" },
      { id: "breakfast-hours", name: "Asking About Breakfast Hours", description: "Find out when breakfast is served" },
      { id: "checking-out", name: "Checking Out", description: "Complete your stay and pay" },
    ],
    intermediate: [
      { id: "special-occasion", name: "Special Occasion Booking", description: "Plan a honeymoon, anniversary, or family vacation" },
      { id: "room-amenities", name: "Room Amenities", description: "Discuss room preferences and special amenities" },
      { id: "local-attractions", name: "Local Attractions", description: "Get recommendations for nearby sights and activities" },
      { id: "dining-recommendations", name: "Dining Recommendations", description: "Ask about restaurants and dining options in the area" },
      { id: "special-requests", name: "Special Requests", description: "Make arrangements for special needs or preferences" },
    ],
    advanced: [
      { id: "travel-tips", name: "Travel Tips", description: "Share and discuss travel tips and best practices" },
      { id: "hidden-gems", name: "Hidden Gems", description: "Discover lesser-known local attractions and experiences" },
      { id: "cultural-experiences", name: "Cultural Experiences", description: "Explore authentic cultural activities and traditions" },
      { id: "travel-stories", name: "Travel Stories", description: "Share memorable travel experiences and adventures" },
      { id: "travel-philosophy", name: "Travel Philosophy", description: "Discuss perspectives on travel and exploration" },
    ],
  },
  school: {
    beginner: [
      { id: "where-class", name: "Asking Where a Class Is", description: "Find the location of your classroom" },
      { id: "meeting-teacher", name: "Meeting a Teacher", description: "Introduce yourself to a new teacher" },
      { id: "asking-help", name: "Asking for Help", description: "Request assistance with something" },
      { id: "borrowing-pen", name: "Borrowing a Pen", description: "Ask to borrow a writing utensil" },
      { id: "class-time", name: "Asking About Class Time", description: "Find out when a class starts or ends" },
    ],
    intermediate: [
      { id: "parent-teacher-meeting", name: "Parent-Teacher Meeting", description: "Discuss your child's academic progress and concerns" },
      { id: "course-selection", name: "Course Selection", description: "Get advice on choosing classes and academic paths" },
      { id: "extracurriculars", name: "Extracurricular Activities", description: "Explore clubs, sports, and other activities" },
      { id: "academic-goals", name: "Academic Goals", description: "Discuss educational goals and planning" },
      { id: "learning-support", name: "Learning Support", description: "Get help with study strategies and resources" },
    ],
    advanced: [
      { id: "teaching-methods", name: "Teaching Methods", description: "Discuss different pedagogical approaches and their effectiveness" },
      { id: "learning-styles", name: "Learning Styles", description: "Explore how different people learn best" },
      { id: "educational-trends", name: "Educational Trends", description: "Talk about current trends and innovations in education" },
      { id: "technology-in-education", name: "Technology in Education", description: "Discuss the role of technology in the classroom" },
      { id: "educational-philosophy", name: "Educational Philosophy", description: "Share perspectives on what makes effective education" },
    ],
  },
  restaurant: {
    beginner: [
      { id: "ordering-food", name: "Ordering Food", description: "Place an order for a meal" },
      { id: "asking-check", name: "Asking for the Check", description: "Request the bill" },
      { id: "asking-about-dish", name: "Asking About a Dish", description: "Get information about a menu item" },
      { id: "more-water", name: "Asking for More Water", description: "Request a water refill" },
      { id: "simple-reservation", name: "Making a Simple Reservation", description: "Book a table for later" },
    ],
    intermediate: [
      { id: "special-occasion-dinner", name: "Special Occasion Dinner", description: "Plan a birthday dinner or anniversary meal" },
      { id: "dietary-restrictions-menu", name: "Dietary Restrictions", description: "Discuss menu options for dietary needs and allergies" },
      { id: "wine-pairing", name: "Wine Pairing", description: "Get recommendations for wine pairings with your meal" },
      { id: "chef-specials", name: "Chef's Specials", description: "Learn about today's specials and chef recommendations" },
      { id: "group-reservation", name: "Group Reservation", description: "Book a table for a larger party with specific needs" },
    ],
    advanced: [
      { id: "culinary-discussion", name: "Culinary Discussion", description: "Discuss cooking techniques, ingredients, and culinary traditions" },
      { id: "ingredient-sourcing-restaurant", name: "Ingredient Sourcing", description: "Talk about where ingredients come from and quality" },
      { id: "chef-inspiration", name: "Chef's Inspiration", description: "Learn about the chef's creative process and influences" },
      { id: "cooking-experiences", name: "Cooking Experiences", description: "Share your own cooking experiences and favorite cuisines" },
      { id: "food-critique", name: "Food Critique", description: "Discuss flavors, presentation, and culinary artistry" },
    ],
  },
  "grocery-store": {
    beginner: [
      { id: "finding-item", name: "Finding an Item", description: "Locate a product in the store" },
      { id: "price-check", name: "Price Check", description: "Ask about the cost of an item" },
      { id: "paying-register", name: "Paying at the Register", description: "Complete your purchase" },
      { id: "item-availability", name: "Asking About Item Availability", description: "Check if something is in stock" },
      { id: "returning-item", name: "Returning an Item", description: "Return a product you purchased" },
    ],
    intermediate: [
      { id: "meal-planning", name: "Meal Planning", description: "Plan a dinner party or special meal with ingredient suggestions" },
      { id: "recipe-ingredients", name: "Recipe Ingredients", description: "Find all ingredients needed for a specific recipe" },
      { id: "dietary-shopping", name: "Dietary Shopping", description: "Shop for specific dietary needs or restrictions" },
      { id: "quantity-planning", name: "Quantity Planning", description: "Determine how much to buy for a group or event" },
      { id: "ingredient-substitutions", name: "Ingredient Substitutions", description: "Find alternatives when an ingredient is unavailable" },
    ],
    advanced: [
      { id: "culinary-techniques", name: "Culinary Techniques", description: "Discuss cooking methods and preparation techniques" },
      { id: "seasonal-produce", name: "Seasonal Produce", description: "Talk about seasonal ingredients and their best uses" },
      { id: "nutrition-discussion", name: "Nutrition Discussion", description: "Discuss nutritional value and healthy eating" },
      { id: "cooking-philosophy", name: "Cooking Philosophy", description: "Share perspectives on cooking style and food culture" },
      { id: "recipe-development-grocery", name: "Recipe Development", description: "Discuss creating and refining recipes with ingredients" },
    ],
  },
};

export function getTopicsForLocation(
  locationSlug: string,
  difficulty: DifficultyLevel
): Topic[] {
  return topics[locationSlug]?.[difficulty] ?? [];
}

export function getAllTopicIdsForLocation(
  locationSlug: string,
  difficulty: DifficultyLevel
): string[] {
  const locationTopics = getTopicsForLocation(locationSlug, difficulty);
  return locationTopics.map((t) => t.id);
}

export function getTopicById(
  locationSlug: string,
  difficulty: DifficultyLevel,
  topicId: string
): Topic | undefined {
  const locationTopics = getTopicsForLocation(locationSlug, difficulty);
  return locationTopics.find((t) => t.id === topicId);
}

