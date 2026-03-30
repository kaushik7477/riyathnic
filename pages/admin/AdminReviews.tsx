import React, { useState, useEffect } from 'react';
import { Check, X, Trash2, Search } from 'lucide-react';
import { fetchReviews, updateReview, deleteReview } from '../../src/api';

const AdminReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await fetchReviews(true); // Pass true for admin
      setReviews(data);
    } catch (err) {
      // console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm("Approve this review?")) return;
    try {
      await updateReview(id, { isApproved: true });
      loadReviews();
    } catch (err) {
      alert("Failed to approve");
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm("Reject and delete this review?")) return;
    try {
      await deleteReview(id);
      loadReviews();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Vibe Check</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Approve or Reject Customer Vibes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map(review => (
          <div key={review._id} className={`bg-zinc-900 border ${review.isApproved ? 'border-green-500/50' : 'border-yellow-500/50'} rounded-xl overflow-hidden`}>
            <div className="aspect-[4/5] relative">
                <img src={review.imageUrl} alt={review.customerName} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${review.isApproved ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'}`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                    </span>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-white">{review.customerName || 'Anonymous'}</h3>
                        <p className="text-zinc-500 text-sm font-mono">{review.userPhone || 'No Phone'}</p>
                    </div>
                    {review.rating && (
                        <div className="flex gap-0.5 bg-black/40 p-1.5 rounded-lg border border-white/5">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                    key={star}
                                    viewBox="0 0 24 24" 
                                    className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400' : 'text-zinc-700'}`}
                                    fill="currentColor"
                                >
                                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                            ))}
                        </div>
                    )}
                </div>

                {review.comment && (
                    <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                        <p className="text-xs text-zinc-400 italic">
                            "{review.comment}"
                        </p>
                    </div>
                )}
                
                <div className="flex gap-2 pt-4 border-t border-white/5">
                    {!review.isApproved && (
                        <button 
                            onClick={() => handleApprove(review._id)}
                            className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Check className="w-4 h-4" /> Approve
                        </button>
                    )}
                    <button 
                        onClick={() => handleReject(review._id)}
                        className="flex-1 bg-zinc-800 hover:bg-red-500 hover:text-white text-zinc-400 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                        {review.isApproved ? <Trash2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {review.isApproved ? 'Delete' : 'Reject'}
                    </button>
                </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
            <div className="col-span-full text-center py-20 text-zinc-500">
                No reviews found.
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
