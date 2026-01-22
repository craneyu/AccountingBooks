import { 
  faUtensils, faBus, faBed, faShoppingBag, faFilm, faPills, 
  faTshirt, faLaptop, faCamera, faCoffee, faPlane, faHeart, 
  faGift, faCreditCard, faGasPump, faTrain, faTag, faCoins,
  faHospital, faTicketAlt, faUmbrellaBeach, faDumbbell,
  faGamepad, faBook, faGraduationCap, faSmoking, faWineGlass
} from '@fortawesome/free-solid-svg-icons';

export const CATEGORY_ICONS: { [key: string]: any } = {
  'utensils': faUtensils,
  'bus': faBus,
  'bed': faBed,
  'shopping-bag': faShoppingBag,
  'film': faFilm,
  'pills': faPills,
  'tshirt': faTshirt,
  'laptop': faLaptop,
  'camera': faCamera,
  'coffee': faCoffee,
  'plane': faPlane,
  'heart': faHeart,
  'gift': faGift,
  'credit-card': faCreditCard,
  'gas-pump': faGasPump,
  'train': faTrain,
  'tag': faTag,
  'coins': faCoins,
  'hospital': faHospital,
  'ticket': faTicketAlt,
  'beach': faUmbrellaBeach,
  'gym': faDumbbell,
  'game': faGamepad,
  'book': faBook,
  'school': faGraduationCap,
  'smoking': faSmoking,
  'wine': faWineGlass
};

export const AVAILABLE_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function getIcon(name: string | undefined): any {
  if (!name || !CATEGORY_ICONS[name]) return faTag;
  return CATEGORY_ICONS[name];
}
