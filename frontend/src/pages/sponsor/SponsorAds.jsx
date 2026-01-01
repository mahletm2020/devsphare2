import { useState, useEffect } from 'react';
import { FiSend, FiCheckCircle, FiXCircle, FiClock, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import { adRequestAPI } from '../../api/adRequestAPI';
import { format } from 'date-fns';

export default function SponsorAds() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    headline: '',
    ad_copy: '',
    link_url: '',
    image_url: '',
  });
  const [adRequests, setAdRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdRequests();
  }, []);

  const loadAdRequests = async () => {
    setLoading(true);
    try {
      const data = await adRequestAPI.getMyRequests();
      setAdRequests(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error('Failed to load ad requests:', err);
      if (err.response?.status === 403) {
        toast.error('You do not have sponsor permissions. Please contact support.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to load ad requests');
      }
      setAdRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithChapa = async (id) => {
    setSubmitting(true);
    try {
      const returnUrl = `${window.location.origin}/sponsor/ads?payment=success`;
      const response = await adRequestAPI.initializePayment(id, returnUrl);
      
      if (response.checkout_url) {
        // Redirect to Chapa payment page
        window.location.href = response.checkout_url;
      } else {
        toast.error('Failed to initialize payment. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Payment initialization error:', err);
      toast.error(err.response?.data?.message || 'Failed to initialize payment');
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await adRequestAPI.create(formData);
      toast.success('Ad request submitted successfully!');
      setFormData({
        title: '',
        description: '',
        headline: '',
        ad_copy: '',
        link_url: '',
        image_url: '',
      });
      loadAdRequests();
    } catch (err) {
      console.error('Failed to submit ad request:', err);
      toast.error(err.response?.data?.message || 'Failed to submit ad request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FiXCircle className="text-red-500" />;
      default:
        return <FiClock className="text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sponsor Ads</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          Submit ad requests and manage your advertisement placements.
        </p>
      </div>

      {/* Submit Ad Request Form */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Submit New Ad Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Title *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Tech Conference 2024"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-gray-300 dark:border-gray-600"
              placeholder="Describe your advertisement..."
            />
          </div>

          <Input
            label="Headline"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            placeholder="Short catchy headline"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ad Copy
            </label>
            <textarea
              name="ad_copy"
              value={formData.ad_copy}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary border-gray-300 dark:border-gray-600"
              placeholder="Ad content/copy..."
            />
          </div>

          <Input
            label="Link URL"
            name="link_url"
            type="url"
            value={formData.link_url}
            onChange={handleChange}
            placeholder="https://example.com"
          />

          <Input
            label="Image URL"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : (
              <>
                <FiSend className="mr-2" />
                Submit Ad Request
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Ad Requests List */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          My Ad Requests
        </h2>
        
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : adRequests.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No ad requests yet. Submit your first ad request above.
          </p>
        ) : (
          <div className="space-y-4">
            {adRequests.map((request) => (
              <div
                key={request.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.title}
                      </h3>
                      {getStatusIcon(request.status)}
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {request.description}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Submitted: {format(new Date(request.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>

                {request.status === 'approved' && request.amount && request.payment_status !== 'paid' && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-1">
                          <FiDollarSign />
                          <span className="font-semibold">Amount: ETB {parseFloat(request.amount).toFixed(2)}</span>
                        </div>
                        {request.admin_response && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {request.admin_response}
                          </p>
                        )}
                      </div>
                      <Button 
                        variant="success" 
                        className="text-sm px-3 py-1.5"
                        onClick={() => handlePayWithChapa(request.id)}
                        disabled={submitting}
                      >
                        <FiCreditCard className="mr-2" />
                        {submitting ? 'Processing...' : 'Pay with Chapa'}
                      </Button>
                    </div>
                  </div>
                )}
                
                {request.status === 'approved' && request.payment_status === 'paid' && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                      <FiCheckCircle />
                      <span className="font-semibold">Payment Completed - Ad is Posted</span>
                    </div>
                  </div>
                )}

                {request.status === 'rejected' && request.admin_response && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      <strong>Response:</strong> {request.admin_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
