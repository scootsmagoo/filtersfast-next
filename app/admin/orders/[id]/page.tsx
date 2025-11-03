'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { hasAdminAccess } from '@/lib/auth-admin'
import Card from '@/components/ui/Card'
import { 
  ArrowLeft, Package, User, MapPin, CreditCard, Truck, 
  Calendar, DollarSign, FileText, History, MessageSquare,
  Edit2, RotateCcw, XCircle, CheckCircle, AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface OrderDetailResponse {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  is_guest: boolean
  status: string
  payment_status: string
  shipping_status: string
  subtotal: number
  discount_amount: number
  shipping_cost: number
  tax_amount: number
  total: number
  shipping_address: any
  billing_address: any
  payment_method: string
  tracking_number: string | null
  shipping_method: string | null
  promo_code: string | null
  donation_amount: number
  customer_notes: string | null
  internal_notes: string | null
  created_at: number
  items: any[]
  notes: any[]
  history: any[]
  refunds: any[]
}

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending } = useSession()
  
  const [order, setOrder] = useState<OrderDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history'>('details')
  
  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  
  // Form states
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [newShippingStatus, setNewShippingStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<'internal' | 'customer'>('internal')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full')
  const [cancelReason, setCancelReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Redirect if not admin
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/sign-in?redirect=/admin/orders')
    } else if (!isPending && session?.user && !hasAdminAccess(session.user)) {
      router.push('/')
    }
  }, [session, isPending, router])

  // Fetch order details
  useEffect(() => {
    if (!session?.user || !hasAdminAccess(session.user) || !params.id) return
    fetchOrder()
  }, [session, params.id])

  async function fetchOrder() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      
      const data = await response.json()
      setOrder(data)
      setNewStatus(data.status)
      setNewPaymentStatus(data.payment_status)
      setNewShippingStatus(data.shipping_status)
      setTrackingNumber(data.tracking_number || '')
      setError(null)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus() {
    if (!order) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          payment_status: newPaymentStatus,
          shipping_status: newShippingStatus,
          tracking_number: trackingNumber || undefined,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to update order')
      
      await fetchOrder()
      setShowStatusModal(false)
      alert('Order updated successfully')
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Failed to update order')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAddNote() {
    if (!order || !noteText.trim()) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: noteText,
          note_type: noteType,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to add note')
      
      await fetchOrder()
      setNoteText('')
      setShowNoteModal(false)
      alert('Note added successfully')
    } catch (err) {
      console.error('Error adding note:', err)
      alert('Failed to add note')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRefund() {
    if (!order || !refundAmount || !refundReason) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason,
          refund_type: refundType,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process refund')
      }
      
      await fetchOrder()
      setRefundAmount('')
      setRefundReason('')
      setShowRefundModal(false)
      alert('Refund processed successfully')
    } catch (err: any) {
      console.error('Error processing refund:', err)
      alert(err.message || 'Failed to process refund')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!order || !cancelReason) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelReason,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to cancel order')
      
      await fetchOrder()
      setCancelReason('')
      setShowCancelModal(false)
      alert('Order cancelled successfully')
    } catch (err) {
      console.error('Error cancelling order:', err)
      alert('Failed to cancel order')
    } finally {
      setActionLoading(false)
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'delivered': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
      case 'shipped': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
      case 'processing': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
      case 'pending': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
      case 'cancelled':
      case 'refunded': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
    }
  }

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !hasAdminAccess(session.user)) {
    return null
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Order Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error || 'The order you are looking for does not exist.'}</p>
          <Link href="/admin/orders" className="btn-primary">
            Back to Orders
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="btn-secondary">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                Order {order.order_number}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => setShowStatusModal(true)} className="btn-secondary" aria-label="Update order status">
              <Edit2 className="w-4 h-4 mr-2" aria-hidden="true" />
              Update Status
            </button>
            <button onClick={() => setShowNoteModal(true)} className="btn-secondary" aria-label="Add note to order">
              <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
              Add Note
            </button>
            {order.payment_status === 'paid' && order.status !== 'refunded' && (
              <button onClick={() => setShowRefundModal(true)} className="btn-secondary" aria-label="Process refund">
                <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
                Process Refund
              </button>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button onClick={() => setShowCancelModal(true)} className="text-red-600 hover:text-red-700 px-4 py-2 rounded-lg border border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors" aria-label="Cancel order">
                <XCircle className="w-4 h-4 mr-2 inline" aria-hidden="true" />
                Cancel Order
              </button>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-2 mb-6">
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status.toUpperCase()}
          </span>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.payment_status)}`}>
            Payment: {order.payment_status}
          </span>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.shipping_status)}`}>
            Shipping: {order.shipping_status}
          </span>
          {order.is_guest && (
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              Guest Order
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" aria-hidden="true" />
                Order Items ({order.items.length})
              </h2>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {item.product_image && (
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.product_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">SKU: {item.product_sku}</p>
                      {item.variant_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">Variant: {item.variant_name}</p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        ${item.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Tabs */}
            <Card>
              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex" role="tablist" aria-label="Order information tabs">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'details'}
                    aria-controls="details-panel"
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'details'
                        ? 'text-brand-orange border-b-2 border-brand-orange'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <FileText className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    Details
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'notes'}
                    aria-controls="notes-panel"
                    onClick={() => setActiveTab('notes')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'notes'
                        ? 'text-brand-orange border-b-2 border-brand-orange'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    Notes ({order.notes.length})
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'history'}
                    aria-controls="history-panel"
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-medium transition-colors ${
                      activeTab === 'history'
                        ? 'text-brand-orange border-b-2 border-brand-orange'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <History className="w-4 h-4 inline mr-2" aria-hidden="true" />
                    History ({order.history.length})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div id="details-panel" role="tabpanel" aria-labelledby="details-tab" className="space-y-4">
                    {order.customer_notes && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Customer Notes</h3>
                        <p className="text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                          {order.customer_notes}
                        </p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Internal Notes</h3>
                        <p className="text-gray-600 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                          {order.internal_notes}
                        </p>
                      </div>
                    )}
                    {order.tracking_number && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Tracking Information</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          <strong>Tracking #:</strong> {order.tracking_number}
                        </p>
                        {order.shipping_method && (
                          <p className="text-gray-600 dark:text-gray-300">
                            <strong>Carrier:</strong> {order.shipping_method}
                          </p>
                        )}
                      </div>
                    )}
                    {order.promo_code && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Promo Code</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Code: <strong>{order.promo_code}</strong>
                        </p>
                      </div>
                    )}
                    {order.donation_amount > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Donation</h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          Amount: <strong>${order.donation_amount.toFixed(2)}</strong>
                        </p>
                      </div>
                    )}
                    {order.refunds.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Refunds</h3>
                        {order.refunds.map((refund: any) => (
                          <div key={refund.id} className="bg-red-50 dark:bg-red-900/20 p-3 rounded mb-2">
                            <p className="text-gray-900 dark:text-gray-100">
                              <strong>${refund.amount.toFixed(2)}</strong> - {refund.refund_type}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Reason: {refund.reason}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(refund.created_at).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div id="notes-panel" role="tabpanel" aria-labelledby="notes-tab" className="space-y-3">
                    {order.notes.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">No notes yet</p>
                    ) : (
                      order.notes.map((note: any) => (
                        <div key={note.id} className="border-l-4 border-brand-orange pl-4 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{note.author_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              note.note_type === 'internal' 
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {note.note_type}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-300">{note.note}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div id="history-panel" role="tabpanel" aria-labelledby="history-tab" className="space-y-3">
                    {order.history.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">No history yet</p>
                    ) : (
                      order.history.map((entry: any) => (
                        <div key={entry.id} className="flex gap-3">
                          <div className="w-2 h-2 rounded-full bg-brand-orange mt-2"></div>
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-gray-100">{entry.description}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              by {entry.performed_by_name} • {new Date(entry.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" aria-hidden="true" />
                Customer
              </h2>
              <div className="space-y-2">
                <p className="text-gray-900 dark:text-gray-100 font-medium">{order.customer_name}</p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{order.customer_email}</p>
                {order.is_guest && (
                  <p className="text-xs text-orange-600 dark:text-orange-400">Guest Checkout</p>
                )}
              </div>
            </Card>

            {/* Shipping Address */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" aria-hidden="true" />
                Shipping Address
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <p>{order.shipping_address.name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phone && <p className="mt-2">📞 {order.shipping_address.phone}</p>}
              </div>
            </Card>

            {/* Payment Info */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" aria-hidden="true" />
                Payment
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p><strong>Method:</strong> {order.payment_method}</p>
                {order.payment_intent_id && (
                  <p className="text-xs break-all"><strong>Payment ID:</strong> {order.payment_intent_id}</p>
                )}
              </div>
            </Card>

            {/* Order Total */}
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" aria-hidden="true" />
                Order Total
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                  <span className="text-gray-900 dark:text-gray-100">${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount:</span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Shipping:</span>
                  <span className="text-gray-900 dark:text-gray-100">${order.shipping_cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Tax:</span>
                  <span className="text-gray-900 dark:text-gray-100">${order.tax_amount.toFixed(2)}</span>
                </div>
                {order.donation_amount > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>Donation:</span>
                    <span>${order.donation_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-lg">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Update Status Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
            <Card className="p-6 max-w-md w-full">
              <h2 id="status-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Update Order Status</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="order-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order Status
                  </label>
                  <select
                    id="order-status-select"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="on-hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="payment-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Payment Status
                  </label>
                  <select
                    id="payment-status-select"
                    value={newPaymentStatus}
                    onChange={(e) => setNewPaymentStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="authorized">Authorized</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="shipping-status-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Shipping Status
                  </label>
                  <select
                    id="shipping-status-select"
                    value={newShippingStatus}
                    onChange={(e) => setNewShippingStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="not-shipped">Not Shipped</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipped">Shipped</option>
                    <option value="in-transit">In Transit</option>
                    <option value="out-for-delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="tracking-number-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tracking Number (optional)
                  </label>
                  <input
                    id="tracking-number-input"
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    aria-label="Tracking number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    aria-disabled={actionLoading}
                    aria-label={actionLoading ? 'Updating order status' : 'Update order status'}
                    className="btn-primary flex-1"
                  >
                    {actionLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    disabled={actionLoading}
                    aria-disabled={actionLoading}
                    aria-label="Cancel and close modal"
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">
            <Card className="p-6 max-w-md w-full">
              <h2 id="note-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Add Note</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="note-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note Type
                  </label>
                  <select
                    id="note-type-select"
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as 'internal' | 'customer')}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="internal">Internal (Staff Only)</option>
                    <option value="customer">Customer Visible</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="note-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note
                  </label>
                  <textarea
                    id="note-textarea"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter note..."
                    rows={4}
                    aria-label="Note content"
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleAddNote}
                    disabled={actionLoading || !noteText.trim()}
                    aria-disabled={actionLoading || !noteText.trim()}
                    aria-label={actionLoading ? 'Adding note' : 'Add note to order'}
                    className="btn-primary flex-1 disabled:opacity-50"
                  >
                    {actionLoading ? 'Adding...' : 'Add Note'}
                  </button>
                  <button
                    onClick={() => setShowNoteModal(false)}
                    disabled={actionLoading}
                    aria-disabled={actionLoading}
                    aria-label="Cancel and close modal"
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="refund-modal-title">
            <Card className="p-6 max-w-md w-full">
              <h2 id="refund-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Process Refund</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="refund-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Refund Type
                  </label>
                  <select
                    id="refund-type-select"
                    value={refundType}
                    onChange={(e) => {
                      setRefundType(e.target.value as 'full' | 'partial')
                      if (e.target.value === 'full') {
                        setRefundAmount(order.total.toString())
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="full">Full Refund</option>
                    <option value="partial">Partial Refund</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="refund-amount-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amount (max: ${order.total.toFixed(2)})
                  </label>
                  <input
                    id="refund-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    max={order.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    aria-label="Refund amount"
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label htmlFor="refund-reason-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason
                  </label>
                  <textarea
                    id="refund-reason-textarea"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Enter refund reason..."
                    rows={3}
                    aria-label="Refund reason"
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm text-yellow-800 dark:text-yellow-400" role="note">
                  ⚠️ This will process a refund through Stripe. This action cannot be undone.
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleRefund}
                    disabled={actionLoading || !refundAmount || !refundReason}
                    aria-disabled={actionLoading || !refundAmount || !refundReason}
                    aria-label={actionLoading ? 'Processing refund' : 'Process refund through Stripe'}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Processing...' : 'Process Refund'}
                  </button>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    disabled={actionLoading}
                    aria-disabled={actionLoading}
                    aria-label="Cancel and close modal"
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            <Card className="p-6 max-w-md w-full">
              <h2 id="cancel-modal-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Cancel Order</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cancel-reason-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cancellation Reason
                  </label>
                  <textarea
                    id="cancel-reason-textarea"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter cancellation reason..."
                    rows={3}
                    aria-label="Cancellation reason"
                    aria-required="true"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm text-red-800 dark:text-red-400" role="note">
                  ⚠️ This will cancel the order. You may need to process a refund separately if payment was captured.
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading || !cancelReason}
                    aria-disabled={actionLoading || !cancelReason}
                    aria-label={actionLoading ? 'Cancelling order' : 'Cancel order permanently'}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={actionLoading}
                    aria-disabled={actionLoading}
                    aria-label="Close modal"
                    className="btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

