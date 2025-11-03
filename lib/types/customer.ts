/**
 * Customer Type Definitions
 * Defines the structure for customer data and related operations
 */

/**
 * Customer Status
 */
export type CustomerStatus = 'A' | 'I'; // A = Active, I = Inactive

/**
 * Payment Type Options
 */
export type PaymentType = 
  | 'MailIn'
  | 'CallIn'
  | 'FaxIn'
  | 'COD'
  | 'CreditCard'
  | 'PayPal'
  | '50_PayPalExpress'
  | 'Venmo'
  | 'VenmoExpress'
  | '2CheckOut'
  | 'AuthorizeNet'
  | 'Custom';

/**
 * Customer Address Information
 */
export interface CustomerAddress {
  name: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  state2?: string; // Alternative state field for international
  country: string;
  zip: string;
}

/**
 * Core Customer Interface
 */
export interface Customer {
  idCust: number;
  status: CustomerStatus;
  dateCreated: string; // ISO date string
  
  // Basic Information
  name: string;
  lastName: string;
  email: string;
  phone: string;
  customerCompany?: string;
  
  // Billing Address
  address: string;
  city: string;
  locState: string;
  locState2?: string;
  locCountry: string;
  zip: string;
  
  // Shipping Address (optional - if different from billing)
  shippingName?: string;
  shippingLastName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingLocState?: string;
  shippingLocState2?: string;
  shippingLocCountry?: string;
  shippingZip?: string;
  
  // Preferences
  futureMail: 'Y' | 'N'; // Email reminders
  remindin: number; // Months until reminder
  newsletter: 'Y' | 'N'; // Newsletter subscription
  paymentType?: PaymentType;
  
  // Tax
  taxExempt: 'Y' | 'N';
  taxExemptExpiration?: string; // ISO date string
  
  // Affiliate
  affiliate: 'Y' | 'N' | 'A'; // Y = Yes, N = No, A = Applied
  commPerc?: number; // Commission percentage
  
  // Security
  signinAttempts: number;
  guestAccount: boolean;
  
  // Admin Notes
  generalComments?: string;
}

/**
 * Customer with additional computed fields for display
 */
export interface CustomerWithStats extends Customer {
  orderCount: number;
  affCount: number; // Affiliate sales count
  billingAddress?: string; // Formatted billing address
  shippingAddressFormatted?: string; // Formatted shipping address (if different)
}

/**
 * Customer Search/Filter Parameters
 */
export interface CustomerSearchParams {
  showField?: 'idcust' | 'email' | 'name' | 'phone' | 'customerCompany' | 'address';
  showCondition?: 'EQUALS' | 'LIKE';
  showPhrase?: string;
  showStatus?: CustomerStatus | '';
  stateSearch?: string;
  countrySearch?: string;
  
  // Pagination
  page?: number;
  pageSize?: number;
  
  // Sorting
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Customer Update Data (partial customer for updates)
 */
export interface CustomerUpdateData {
  // Status
  status?: CustomerStatus;
  
  // Basic Information
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  customerCompany?: string;
  
  // Billing Address
  address?: string;
  city?: string;
  locState?: string;
  locState2?: string;
  locCountry?: string;
  zip?: string;
  
  // Shipping Address
  shippingName?: string;
  shippingLastName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingLocState?: string;
  shippingLocState2?: string;
  shippingLocCountry?: string;
  shippingZip?: string;
  
  // Preferences
  futureMail?: 'Y' | 'N';
  remindin?: number;
  newsletter?: 'Y' | 'N';
  paymentType?: PaymentType;
  
  // Tax
  taxExempt?: 'Y' | 'N';
  taxExemptExpiration?: string;
  
  // Affiliate
  affiliate?: 'Y' | 'N' | 'A';
  commPerc?: number;
  
  // Admin Notes (appends to existing)
  generalComments?: string;
}

/**
 * Customer Email History Event
 */
export interface CustomerEmailEvent {
  messageID: string;
  email: string;
  eventType: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'deferred' | 'spam_report';
  eventDetail?: string;
  eventTimestamp: string; // ISO date string
  templateName?: string;
  outcome: 'good' | 'bad';
}

/**
 * Customer Payment Log Entry
 */
export interface CustomerPaymentLog {
  idLog: number;
  logTimestamp: string; // ISO date string
  idOrder?: number;
  logValue: string;
  additionalData?: string;
  isTokenized: boolean;
  issueReported: boolean;
}

/**
 * Customer Appliance Model
 */
export interface CustomerModel {
  idModel: number;
  idCust: number;
  dateAdded: string; // ISO date string
  fridgeModelNumber: string;
}

/**
 * Customer Merge Request
 */
export interface CustomerMergeRequest {
  idCustTo: number; // Target customer ID
  mergeType: 'customer' | 'order'; // Merge by customer IDs or order IDs
  mergeIDs: number[]; // Array of customer or order IDs to merge
  markInactive: boolean; // Mark old accounts as inactive
}

/**
 * Customer Merge Preview
 */
export interface CustomerMergePreview {
  idCust?: number;
  idOrder?: number;
  name?: string;
  lastName?: string;
  email?: string;
  orderCount?: number;
  dateCreated?: string;
}

/**
 * Customer List Response (paginated)
 */
export interface CustomerListResponse {
  customers: CustomerWithStats[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Customer Impersonation Request
 */
export interface CustomerImpersonateRequest {
  idCust: number;
  locCountry: string;
  goto?: 'models' | 'subscriptions' | 'orders';
}

/**
 * Admin Note (for appending to customer comments)
 */
export interface AdminNote {
  adminName: string;
  timestamp: string; // ISO date string
  content: string;
}

/**
 * Customer Statistics
 */
export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  newThisMonth: number;
  newThisWeek: number;
  guestAccounts: number;
  taxExemptCount: number;
  affiliateCount: number;
}

