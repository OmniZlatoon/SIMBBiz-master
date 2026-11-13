/* eslint-disable react-refresh/only-export-components */
import type { HTMLAttributes } from 'react';

type MaterialIconProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  size?: number | string;
  strokeWidth?: number;
  filled?: boolean;
};

export function MaterialIcon({ name, size, filled = false, className = '', style, ...props }: MaterialIconProps) {
  return (
    <span
      {...props}
      className={`material-icon${filled ? ' material-icon-filled' : ''}${className ? ` ${className}` : ''}`}
      style={{ fontSize: size, ...style }}
      aria-hidden={props['aria-label'] ? undefined : true}
    >
      {name}
    </span>
  );
}

const icon = (name: string) => (props: Omit<MaterialIconProps, 'name'>) => <MaterialIcon name={name} {...props} />;

export const Home = icon('home');
export const Package = icon('inventory_2');
export const Users = icon('group');
export const DollarSign = icon('payments');
export const PieChart = icon('pie_chart');
export const Settings = icon('settings');
export const Menu = icon('menu');
export const X = icon('close');
export const Store = icon('storefront');
export const StoreIcon = Store;
export const LogOut = icon('logout');
export const Moon = icon('dark_mode');
export const Sun = icon('light_mode');
export const CreditCard = icon('credit_card');
export const TrendingUp = icon('trending_up');
export const ArrowLeft = icon('arrow_back');
export const ArrowRight = icon('arrow_forward');
export const Lock = icon('lock');
export const Shield = icon('shield');
export const Trash2 = icon('delete');
export const CheckCircle = icon('check_circle');
export const XCircle = icon('cancel');
export const LayoutDashboard = icon('dashboard');
export const Megaphone = icon('campaign');
export const Server = icon('dns');
export const MessageSquare = icon('chat');
export const Power = icon('power_settings_new');
export const Plus = icon('add');
export const Search = icon('search');
export const Edit2 = icon('edit');
export const ImageIcon = icon('image');
export const Loader2 = icon('autorenew');
export const CheckCircle2 = CheckCircle;
export const ShieldCheck = icon('verified_user');
export const Phone = icon('call');
export const Info = icon('info');
export const Zap = icon('bolt');
export const Check = icon('check');
export const MapPin = icon('location_on');
export const KeyRound = icon('key');
export const Mail = icon('mail');
export const MessageCircle = icon('forum');
export const ShoppingBag = icon('shopping_bag');
export const Copy = icon('content_copy');
export const ExternalLink = icon('open_in_new');
export const Tag = icon('sell');
export const ChevronRight = icon('chevron_right');
export const ChevronLeft = icon('chevron_left');
export const ChevronRightIcon = ChevronRight;
export const Sparkles = icon('auto_awesome');
export const Smartphone = icon('smartphone');
export const LayoutGrid = icon('grid_view');
export const TrendingDown = icon('trending_down');
export const Calendar = icon('calendar_month');
export const Save = icon('save');
export const User = icon('person');
export const Star = icon('star');
export const Share2 = icon('share');
