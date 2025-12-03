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
    intermediate: [],
    advanced: [],
  },
  bank: {
    beginner: [
      { id: "opening-account", name: "Opening an Account", description: "Start a new bank account" },
      { id: "withdrawing-money", name: "Withdrawing Money", description: "Take money out from your account" },
      { id: "asking-hours", name: "Asking About Hours", description: "Find out when the bank is open" },
      { id: "help-with-card", name: "Getting Help with a Card", description: "Get assistance with your bank card" },
      { id: "exchanging-money", name: "Exchanging Money", description: "Exchange currency at the bank" },
    ],
    intermediate: [],
    advanced: [],
  },
  hotel: {
    beginner: [
      { id: "checking-in", name: "Checking In", description: "Register and get your room key" },
      { id: "asking-wifi", name: "Asking for Wi-Fi", description: "Get the Wi-Fi password" },
      { id: "asking-towels", name: "Asking for Towels", description: "Request extra towels for your room" },
      { id: "breakfast-hours", name: "Asking About Breakfast Hours", description: "Find out when breakfast is served" },
      { id: "checking-out", name: "Checking Out", description: "Complete your stay and pay" },
    ],
    intermediate: [],
    advanced: [],
  },
  school: {
    beginner: [
      { id: "where-class", name: "Asking Where a Class Is", description: "Find the location of your classroom" },
      { id: "meeting-teacher", name: "Meeting a Teacher", description: "Introduce yourself to a new teacher" },
      { id: "asking-help", name: "Asking for Help", description: "Request assistance with something" },
      { id: "borrowing-pen", name: "Borrowing a Pen", description: "Ask to borrow a writing utensil" },
      { id: "class-time", name: "Asking About Class Time", description: "Find out when a class starts or ends" },
    ],
    intermediate: [],
    advanced: [],
  },
  restaurant: {
    beginner: [
      { id: "ordering-food", name: "Ordering Food", description: "Place an order for a meal" },
      { id: "asking-check", name: "Asking for the Check", description: "Request the bill" },
      { id: "asking-about-dish", name: "Asking About a Dish", description: "Get information about a menu item" },
      { id: "more-water", name: "Asking for More Water", description: "Request a water refill" },
      { id: "simple-reservation", name: "Making a Simple Reservation", description: "Book a table for later" },
    ],
    intermediate: [],
    advanced: [],
  },
  "grocery-store": {
    beginner: [
      { id: "finding-item", name: "Finding an Item", description: "Locate a product in the store" },
      { id: "price-check", name: "Price Check", description: "Ask about the cost of an item" },
      { id: "paying-register", name: "Paying at the Register", description: "Complete your purchase" },
      { id: "item-availability", name: "Asking About Item Availability", description: "Check if something is in stock" },
      { id: "returning-item", name: "Returning an Item", description: "Return a product you purchased" },
    ],
    intermediate: [],
    advanced: [],
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

