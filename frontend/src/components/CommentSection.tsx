import { useState, useEffect } from 'react';
import { Send, Lock, Eye, EyeOff, User } from 'lucide-react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

interface Comment {
  id: string;
  text: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    avatar: string | null;
  };
}

interface CommentSectionProps {
  reportId: string;
  currentUserRole: string;
}

export default function CommentSection({ reportId, currentUserRole }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canViewInternal = ['ADMIN', 'SUPER_ADMIN', 'TRIAGER', 'COMPANY_ADMIN'].includes(currentUserRole);

  useEffect(() => {
    fetchComments();
  }, [reportId]);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/${reportId}`);
      setComments(res.data);
    } catch (error) {
      console.error('Fetch comments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/comments/${reportId}`, {
        text: newComment,
        isInternal: canViewInternal ? isInternal : false
      });
      setComments([...comments, res.data]);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error('Add comment error:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold flex items-center gap-2">
        Discussion
        <span className="text-sm font-normal text-slate-500">({comments.length})</span>
      </h3>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-center py-4 text-slate-500">Loading discussion...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-xl">
            No comments yet. Start the discussion.
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`flex gap-4 p-4 rounded-xl border ${
                comment.isInternal 
                  ? 'bg-amber-500/5 border-amber-500/20' 
                  : 'bg-[hsl(var(--bg-card))] border-[hsl(var(--border-subtle))]'
              }`}
            >
              <div className="shrink-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                   comment.isInternal ? 'bg-amber-500' : 'bg-indigo-500'
                }`}>
                  {comment.user.avatar ? (
                    <img src={comment.user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span>{comment.user.firstName[0]}</span>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[hsl(var(--text-main))]">
                      {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-medium uppercase tracking-wider">
                      {comment.user.role.replace('_', ' ')}
                    </span>
                    {comment.isInternal && (
                      <span className="flex items-center gap-1 text-xs text-amber-500 font-bold uppercase tracking-wider">
                        <Lock className="w-3 h-3" /> Internal Note
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-[hsl(var(--text-muted))] whitespace-pre-wrap leading-relaxed">
                  {comment.text}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="border border-[hsl(var(--border-subtle))] rounded-2xl overflow-hidden bg-[hsl(var(--bg-card))]">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Leave a comment..."
          className="w-full bg-transparent p-4 min-h-[100px] outline-none text-[hsl(var(--text-main))] placeholder:text-slate-600 resize-none"
        />
        <div className="bg-[hsl(var(--bg-main))]/50 p-3 flex justify-between items-center border-t border-[hsl(var(--border-subtle))]">
          <div>
            {canViewInternal && (
              <label className={`flex items-center gap-2 text-xs font-bold cursor-pointer select-none transition-colors ${isInternal ? 'text-amber-500' : 'text-slate-500 hover:text-slate-400'}`}>
                <input 
                  type="checkbox" 
                  checked={isInternal} 
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="hidden"
                />
                {isInternal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isInternal ? 'INTERNAL NOTE (Hidden from Researcher)' : 'Public Comment'}
              </label>
            )}
          </div>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? 'Sending...' : 'Post Comment'}
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
