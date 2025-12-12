'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

import type {
  Package,
  Shipment,
  ShippingCarrier,
  ShippingConfig,
} from '@/lib/types/shipping';

interface LabelWorkflowProps {
  configs: ShippingConfig[];
}

interface AddressForm {
  name: string;
  company: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_residential: boolean;
}

interface PackageForm extends Package {
  id: string;
}

const createDefaultPackage = (): PackageForm => ({
  id: crypto.randomUUID(),
  weight: 1,
  length: 10,
  width: 8,
  height: 4,
  contents_type: 'merchandise',
  description: 'Filters',
});

const defaultDestination: AddressForm = {
  name: '',
  company: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'US',
  phone: '',
  is_residential: true,
};

export default function LabelWorkflow({ configs }: LabelWorkflowProps) {
  const [orderId, setOrderId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [carrier, setCarrier] = useState<ShippingCarrier>('ups');
  const [serviceCode, setServiceCode] = useState('');
  const [labelFormat, setLabelFormat] = useState<'PDF' | 'PNG' | 'ZPL'>('PDF');
  const [labelSize, setLabelSize] = useState<'4x6' | '8x11'>('4x6');
  const [isReturn, setIsReturn] = useState(false);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState<number | ''>('');
  const [destination, setDestination] = useState<AddressForm>(defaultDestination);
  const [packages, setPackages] = useState<PackageForm[]>([createDefaultPackage()]);
  const [notificationEmail, setNotificationEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const fieldIds = {
    orderId: 'label-order-id',
    referenceNumber: 'label-reference-number',
    notificationEmail: 'label-notification-email',
    carrier: 'label-carrier',
    serviceCode: 'label-service-code',
    labelFormat: 'label-format',
    labelSize: 'label-size',
    returnLabel: 'label-return',
    signatureRequired: 'label-signature-required',
    saturdayDelivery: 'label-saturday-delivery',
    insuranceAmount: 'label-insurance-amount',
    destinationName: 'label-destination-name',
    destinationCompany: 'label-destination-company',
    destinationAddress1: 'label-destination-address1',
    destinationAddress2: 'label-destination-address2',
    destinationCity: 'label-destination-city',
    destinationState: 'label-destination-state',
    destinationPostal: 'label-destination-postal',
    destinationCountry: 'label-destination-country',
    destinationPhone: 'label-destination-phone',
    destinationResidential: 'label-destination-residential',
  };

  const packageFieldId = (pkgId: string, field: string) => `label-package-${pkgId}-${field}`;

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/shipping/labels?limit=25');
      if (!response.ok) {
        throw new Error('Failed to load shipment history');
      }
      const data = await response.json();
      setShipments(data.data || []);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load shipment history');
    } finally {
      setHistoryLoading(false);
    }
  }

  const handleDestinationChange = (field: keyof AddressForm, value: string | boolean) => {
    setDestination((prev) => ({
      ...prev,
      [field]: typeof value === 'string' ? value : value,
    }));
  };

  const handlePackageChange = (id: string, field: keyof PackageForm, value: string) => {
    setPackages((prev) =>
      prev.map((pkg) =>
        pkg.id === id
          ? {
              ...pkg,
              [field]:
                field === 'contents_type' || field === 'description'
                  ? value
                  : Number(value),
            }
          : pkg,
      ),
    );
  };

  const addPackage = () => {
    setPackages((prev) => [...prev, createDefaultPackage()]);
  };

  const removePackage = (id: string) => {
    setPackages((prev) => (prev.length > 1 ? prev.filter((pkg) => pkg.id !== id) : prev));
  };

  const resetForm = () => {
    setOrderId('');
    setReferenceNumber('');
    setCarrier('ups');
    setServiceCode('');
    setLabelFormat('PDF');
    setLabelSize('4x6');
    setIsReturn(false);
    setSignatureRequired(false);
    setSaturdayDelivery(false);
    setInsuranceAmount('');
    setDestination(defaultDestination);
    setPackages([createDefaultPackage()]);
    setNotificationEmail('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        order_id: orderId.trim(),
        reference_number: referenceNumber.trim() || orderId.trim(),
        carrier,
        service_code: serviceCode.trim(),
        destination,
        packages: packages.map(({ id, ...pkg }) => pkg),
        label_format: labelFormat,
        label_size: labelSize,
        is_return_label: isReturn,
        signature_required: signatureRequired,
        saturday_delivery: saturdayDelivery,
        insurance_amount: insuranceAmount || undefined,
        metadata: notificationEmail
          ? { notification_email: notificationEmail.trim() }
          : undefined,
      };

      const response = await fetch('/api/admin/shipping/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to create shipping label');
      }

      const shipment = await response.json();
      setShipments((prev) => [shipment, ...prev]);
      setSuccess('Shipping label created successfully');
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create shipping label');
    } finally {
      setLoading(false);
    }
  };

  const dataUrl = (label: Shipment) => {
    const format = label.label_format || labelFormat;
    const mime =
      format === 'PDF'
        ? 'application/pdf'
        : format === 'PNG'
          ? 'image/png'
          : 'application/octet-stream';
    return `data:${mime};base64,${label.label_url}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create Shipping Label
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Use carrier integrations to generate outbound or return labels.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-200"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.orderId}
              >
                Order ID
              </label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                id={fieldIds.orderId}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="e.g. 123456"
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.referenceNumber}
              >
                Reference #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(event) => setReferenceNumber(event.target.value)}
                id={fieldIds.referenceNumber}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Defaults to Order ID"
              />
            </div>
          </div>

          <div>
            <label
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor={fieldIds.notificationEmail}
            >
              Notification Email (optional)
            </label>
            <input
              type="email"
              value={notificationEmail}
              onChange={(event) => setNotificationEmail(event.target.value)}
              id={fieldIds.notificationEmail}
              className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="customer@example.com"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.carrier}
              >
                Carrier
              </label>
              <select
                value={carrier}
                onChange={(event) => setCarrier(event.target.value as ShippingCarrier)}
                id={fieldIds.carrier}
                className="w-full rounded-lg border px-3 py-2 capitalize dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                {configs.map((config) => (
                  <option key={config.carrier} value={config.carrier}>
                    {config.carrier.replace('_', ' ')}
                    {!config.is_active ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.serviceCode}
              >
                Service Code
              </label>
              <input
                type="text"
                required
                value={serviceCode}
                onChange={(event) => setServiceCode(event.target.value)}
                id={fieldIds.serviceCode}
                className="w-full rounded-lg border px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder={
                  carrier === 'dhl'
                    ? 'e.g. DLH_SM_RETURN_LIGHT'
                    : carrier === 'canada_post'
                      ? 'e.g. DOM.EP'
                      : 'Carrier service code'
                }
              />
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.labelFormat}
              >
                Label Format
              </label>
              <select
                value={labelFormat}
                onChange={(event) =>
                  setLabelFormat(event.target.value as 'PDF' | 'PNG' | 'ZPL')
                }
                id={fieldIds.labelFormat}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="PDF">PDF</option>
                <option value="PNG">PNG</option>
                <option value="ZPL">ZPL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.labelSize}
              >
                Label Size
              </label>
              <select
                value={labelSize}
                onChange={(event) =>
                  setLabelSize(event.target.value as '4x6' | '8x11')
                }
                id={fieldIds.labelSize}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="4x6">4x6</option>
                <option value="8x11">8x11</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id={fieldIds.returnLabel}
                type="checkbox"
                checked={isReturn}
                onChange={(event) => setIsReturn(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <label htmlFor={fieldIds.returnLabel} className="text-sm text-gray-700 dark:text-gray-300">
                Return label
              </label>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                id={fieldIds.signatureRequired}
                type="checkbox"
                checked={signatureRequired}
                onChange={(event) => setSignatureRequired(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <label
                htmlFor={fieldIds.signatureRequired}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Signature required
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <input
                id={fieldIds.saturdayDelivery}
                type="checkbox"
                checked={saturdayDelivery}
                onChange={(event) => setSaturdayDelivery(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
              />
              <label
                htmlFor={fieldIds.saturdayDelivery}
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Saturday delivery
              </label>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                htmlFor={fieldIds.insuranceAmount}
              >
                Insurance Amount (optional)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={insuranceAmount}
                onChange={(event) =>
                  setInsuranceAmount(event.target.value ? Number(event.target.value) : '')
                }
                id={fieldIds.insuranceAmount}
                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <h3 className="text-md mb-2 font-semibold text-gray-900 dark:text-gray-100">
              Destination Address
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label htmlFor={fieldIds.destinationName} className="sr-only">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={destination.name}
                  onChange={(event) => handleDestinationChange('name', event.target.value)}
                  id={fieldIds.destinationName}
                  placeholder="Recipient Name"
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationCompany} className="sr-only">
                  Company
                </label>
                <input
                  type="text"
                  value={destination.company}
                  onChange={(event) => handleDestinationChange('company', event.target.value)}
                  id={fieldIds.destinationCompany}
                  placeholder="Company"
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationAddress1} className="sr-only">
                  Address line 1
                </label>
                <input
                  type="text"
                  value={destination.address_line1}
                  onChange={(event) =>
                    handleDestinationChange('address_line1', event.target.value)
                  }
                  id={fieldIds.destinationAddress1}
                  placeholder="Address line 1"
                  required
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationAddress2} className="sr-only">
                  Address line 2
                </label>
                <input
                  type="text"
                  value={destination.address_line2}
                  onChange={(event) =>
                    handleDestinationChange('address_line2', event.target.value)
                  }
                  id={fieldIds.destinationAddress2}
                  placeholder="Address line 2"
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationCity} className="sr-only">
                  City
                </label>
                <input
                  type="text"
                  value={destination.city}
                  onChange={(event) => handleDestinationChange('city', event.target.value)}
                  id={fieldIds.destinationCity}
                  placeholder="City"
                  required
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationState} className="sr-only">
                  State or Province
                </label>
                <input
                  type="text"
                  value={destination.state}
                  onChange={(event) => handleDestinationChange('state', event.target.value)}
                  id={fieldIds.destinationState}
                  placeholder="State / Province"
                  required
                  className="w-full rounded-lg border px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationPostal} className="sr-only">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={destination.postal_code}
                  onChange={(event) =>
                    handleDestinationChange('postal_code', event.target.value)
                  }
                  id={fieldIds.destinationPostal}
                  placeholder="Postal Code"
                  required
                  className="w-full rounded-lg border px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationCountry} className="sr-only">
                  Country
                </label>
                <input
                  type="text"
                  value={destination.country}
                  onChange={(event) => handleDestinationChange('country', event.target.value)}
                  id={fieldIds.destinationCountry}
                  placeholder="Country"
                  required
                  className="w-full rounded-lg border px-3 py-2 uppercase dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div>
                <label htmlFor={fieldIds.destinationPhone} className="sr-only">
                  Phone
                </label>
                <input
                  type="text"
                  value={destination.phone}
                  onChange={(event) => handleDestinationChange('phone', event.target.value)}
                  id={fieldIds.destinationPhone}
                  placeholder="Phone"
                  className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id={fieldIds.destinationResidential}
                  type="checkbox"
                  checked={destination.is_residential}
                  onChange={(event) =>
                    handleDestinationChange('is_residential', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <label
                  htmlFor={fieldIds.destinationResidential}
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Residential address
                </label>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
                Packages
              </h3>
              <Button
                type="button"
                variant="secondary"
                onClick={addPackage}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add package
              </Button>
            </div>

            <div className="space-y-4">
              {packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className="rounded-lg border border-dashed border-gray-200 p-4 dark:border-gray-600"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Package {index + 1}
                    </span>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePackage(pkg.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-300"
                      >
                        <Trash2 className="mr-1 inline h-4 w-4" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                    <div>
                      <label
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                        htmlFor={packageFieldId(pkg.id, 'weight')}
                      >
                        Weight (lb)
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={pkg.weight}
                        onChange={(event) =>
                          handlePackageChange(pkg.id, 'weight', event.target.value)
                        }
                        id={packageFieldId(pkg.id, 'weight')}
                        className="w-full rounded-lg border px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        required
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                        htmlFor={packageFieldId(pkg.id, 'length')}
                      >
                        Length (in)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={pkg.length || ''}
                        onChange={(event) =>
                          handlePackageChange(pkg.id, 'length', event.target.value)
                        }
                        id={packageFieldId(pkg.id, 'length')}
                        className="w-full rounded-lg border px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                        htmlFor={packageFieldId(pkg.id, 'width')}
                      >
                        Width (in)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={pkg.width || ''}
                        onChange={(event) =>
                          handlePackageChange(pkg.id, 'width', event.target.value)
                        }
                        id={packageFieldId(pkg.id, 'width')}
                        className="w-full rounded-lg border px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                        htmlFor={packageFieldId(pkg.id, 'height')}
                      >
                        Height (in)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={pkg.height || ''}
                        onChange={(event) =>
                          handlePackageChange(pkg.id, 'height', event.target.value)
                        }
                        id={packageFieldId(pkg.id, 'height')}
                        className="w-full rounded-lg border px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400"
                        htmlFor={packageFieldId(pkg.id, 'description')}
                      >
                        Description
                      </label>
                      <input
                        type="text"
                        value={pkg.description || ''}
                        onChange={(event) =>
                          handlePackageChange(pkg.id, 'description', event.target.value)
                        }
                        id={packageFieldId(pkg.id, 'description')}
                        className="w-full rounded-lg border px-2 py-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                        placeholder="e.g. Water filters"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={resetForm}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Label
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Shipment History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Recent labels generated across all carriers.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={loadHistory}
            disabled={historyLoading}
            className="flex items-center gap-2"
          >
            {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-600 dark:text-gray-300">
            Loading shipment history...
          </div>
        ) : shipments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
            No shipments created yet.
          </div>
        ) : (
          <div className="max-h-[600px] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <caption className="sr-only">Shipment history</caption>
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Carrier / Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tracking
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {new Date(shipment.created_at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {shipment.order_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="font-medium capitalize">
                        {shipment.carrier.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {shipment.service_name}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {shipment.tracking_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <a
                        href={dataUrl(shipment)}
                        download={`label-${shipment.tracking_number}.${(shipment.label_format || labelFormat).toLowerCase()}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-brand-orange px-3 py-1 text-sm text-brand-orange hover:bg-brand-orange hover:text-white"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

