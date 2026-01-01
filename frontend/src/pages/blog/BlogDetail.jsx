import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiUser, FiEye, FiClock, FiArrowLeft, FiAward, FiEdit2, FiZap, FiMinusCircle, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import blogAPI from '../../api/blogAPI';
import { adRequestAPI } from '../../api/adRequestAPI';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';
import Avatar from '../../components/common/Avatar';

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postedAds, setPostedAds] = useState([]);
  const [reactions, setReactions] = useState({ likes_count: 0, dislikes_count: 0, user_reaction: null });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loadingReactions, setLoadingReactions] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchReactions = useCallback(async () => {
    if (!slug || slug === 'create') return;
    try {
      const response = await blogAPI.getReactions(slug);
      setReactions(response);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, [slug]);

  const fetchComments = useCallback(async () => {
    if (!slug || slug === 'create') return;
    setLoadingComments(true);
    try {
      const response = await blogAPI.getComments(slug);
      setComments(response.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [slug]);

  useEffect(() => {
    const fetchPost = async () => {
      // Prevent fetching if slug is "create" (should be handled by route, but just in case)
      if (slug === 'create') {
        navigate('/blog');
        return;
      }
      
      if (!slug) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await blogAPI.getBySlug(slug);
        console.log('Blog post response:', response); // Debug log
        // The API returns the data directly (not wrapped in response.data)
        // axios already extracts response.data, so response is the actual blog post object
        if (response && (response.id || response.slug || response.title)) {
          setPost(response);
          // Fetch reactions and comments after post is loaded
          fetchReactions();
          fetchComments();
        } else {
          console.error('Invalid response structure:', response);
          setPost(null);
        }
      } catch (error) {
        console.error('Error fetching blog post:', error);
        setPost(null);
        // Don't navigate away, show error message instead
        if (error.response?.status === 404) {
          toast.error('Blog post not found');
        } else {
          toast.error('Failed to load blog post');
        }
      } finally {
        setLoading(false);
      }
    };

    if (slug && slug !== 'create') {
      fetchPost();
    } else if (slug === 'create') {
      navigate('/blog');
    }
  }, [slug, navigate, fetchReactions, fetchComments]);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await adRequestAPI.getPostedAds();
        setPostedAds(response.data || []);
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };
    fetchAds();
  }, []);

  const handleReaction = async (reaction) => {
    if (!user) {
      toast.error('Please login to react to posts');
      return;
    }

    setLoadingReactions(true);
    try {
      const response = await blogAPI.toggleReaction(slug, reaction);
      setReactions({
        likes_count: response.likes_count,
        dislikes_count: response.dislikes_count,
        user_reaction: response.reaction,
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    } finally {
      setLoadingReactions(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    try {
      const response = await blogAPI.addComment(slug, newComment.trim());
      setNewComment('');
      fetchComments(); // Refresh comments
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const handleAddReply = async (parentId) => {
    if (!user) {
      toast.error('Please login to reply');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await blogAPI.addComment(slug, replyContent.trim(), parentId);
      setReplyContent('');
      setReplyingTo(null);
      fetchComments(); // Refresh comments
      toast.success('Reply added successfully');
    } catch (error) {
      console.error('Error adding reply:', error);
      toast.error('Failed to add reply');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await blogAPI.deleteComment(slug, commentId);
      fetchComments(); // Refresh comments
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const AdSpace = ({ size = '300x250', ad }) => {
    if (ad) {
      return (
        <a
          href={ad.link_url || '#'}
          target={ad.link_url ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 mb-6"
        >
          {ad.image_url && (
            <div className="w-full h-32 overflow-hidden">
              <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-4">
            {ad.headline && <p className="text-xs font-semibold text-primary mb-1">{ad.headline}</p>}
            <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">{ad.title}</p>
            {ad.ad_copy && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{ad.ad_copy}</p>}
          </div>
        </a>
      );
    }

    return (
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 backdrop-blur-sm p-6 mb-6">
        <div className="h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Advertisement</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">{size}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!post && !loading) {
    return (
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Blog Post Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/blog')} variant="primary">
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  const canEdit = user && (user.id === post.author?.id || user.roles?.some(r => r.name === 'super_admin'));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Button
            variant="outline"
            onClick={() => navigate('/blog')}
            className="mb-6 flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Blog
          </Button>

          <Card className="overflow-hidden">
            {post.featured_image && (
              <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={post.type === 'winner_announcement' ? 'primary' : 'outline'}
                  className={post.type === 'winner_announcement' ? 'bg-green-500 text-white' : 'text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'}>
                  {post.type === 'winner_announcement' ? (
                    <span className="flex items-center">
                      <FiAward className="mr-1" />
                      Winner Announcement
                    </span>
                  ) : (
                    'General'
                  )}
                </Badge>
                {post.hackathon && (
                  <Badge variant="outline" className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                    <Link to={`/hackathons/${post.hackathon.id}`} className="hover:text-primary dark:hover:text-primary">
                      {post.hackathon.title}
                    </Link>
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {post.title}
              </h1>

              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-5 pb-5 border-b border-gray-200 dark:border-gray-700 flex-wrap">
                <div className="flex items-center gap-2">
                  <Avatar user={post.author} size="sm" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{post.author?.name}</span>
                </div>
                {post.published_at && (
                  <div className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" />
                    <span className="text-gray-600 dark:text-gray-400">{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <FiClock className="w-3.5 h-3.5" />
                  <span className="text-gray-600 dark:text-gray-400">{post.read_time} min read</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FiEye className="w-3.5 h-3.5" />
                  <span className="text-gray-600 dark:text-gray-400">{post.views || 0} views</span>
                </div>
                {canEdit && (
                  <Link to={`/blog/${post.id}/edit`} className="ml-auto flex items-center text-primary hover:underline dark:text-primary text-sm">
                    <FiEdit2 className="mr-1 w-4 h-4" />
                    Edit
                  </Link>
                )}
              </div>

              <div
                className="prose prose-lg dark:prose-invert max-w-none blog-content prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-white prose-strong:text-gray-900 dark:prose-strong:text-white prose-a:text-primary dark:prose-a:text-primary prose-li:text-gray-700 dark:prose-li:text-white prose-ul:text-gray-700 dark:prose-ul:text-white prose-ol:text-gray-700 dark:prose-ol:text-white prose-blockquote:text-gray-700 dark:prose-blockquote:text-white prose-code:text-gray-900 dark:prose-code:text-white prose-pre:text-gray-900 dark:prose-pre:text-white prose-table:text-gray-700 dark:prose-table:text-white prose-h1:text-gray-900 dark:prose-h1:text-white prose-h2:text-gray-900 dark:prose-h2:text-white prose-h3:text-gray-900 dark:prose-h3:text-white prose-h4:text-gray-900 dark:prose-h4:text-white prose-h5:text-gray-900 dark:prose-h5:text-white prose-h6:text-gray-900 dark:prose-h6:text-white"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Reactions Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleReaction('like')}
                    disabled={loadingReactions || !user}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                      reactions.user_reaction === 'like'
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-gray-700'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Like"
                  >
                    <FiZap className={`w-5 h-5 ${reactions.user_reaction === 'like' ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-base">{reactions.likes_count || 0}</span>
                  </button>
                  
                  <button
                    onClick={() => handleReaction('dislike')}
                    disabled={loadingReactions || !user}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                      reactions.user_reaction === 'dislike'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-700'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Dislike"
                  >
                    <FiMinusCircle className={`w-5 h-5 ${reactions.user_reaction === 'dislike' ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-base">{reactions.dislikes_count || 0}</span>
                  </button>
                  
                  {!user && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                      <Link to="/login" className="text-primary hover:underline dark:text-primary">Login</Link> to react
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Comments Section */}
          <Card className="mt-6">
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                Comments ({comments.length})
              </h2>

              {/* Add Comment Form */}
              {user ? (
                <div className="mb-5">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button onClick={handleAddComment} variant="primary" size="sm" disabled={!newComment.trim()}>
                      Post Comment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please <Link to="/login" className="text-primary hover:underline font-medium dark:text-primary">login</Link> to comment
                  </p>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-5 last:border-0">
                      <div className="flex items-start gap-3">
                        <Avatar user={comment.user} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <button
                              onClick={() => {
                                if (comment.user?.id === user?.id) {
                                  navigate('/profile');
                                } else if (comment.user?.id) {
                                  navigate(`/profile/${comment.user.id}`);
                                }
                              }}
                              className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors"
                            >
                              {comment.user.name}
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(comment.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200 mb-2 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-3">
                            {user && (
                              <button
                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                className="text-xs text-primary hover:underline dark:text-primary flex items-center gap-1 transition-colors"
                              >
                                <FiMessageSquare className="w-3.5 h-3.5" />
                                Reply
                              </button>
                            )}
                            {(user?.id === comment.user.id || user?.id === post.author?.id || user?.roles?.some(r => r.name === 'super_admin')) && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            )}
                          </div>

                          {/* Reply Form */}
                          {replyingTo === comment.id && user && (
                            <div className="mt-3 pl-3 border-l-2 border-primary">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                rows="2"
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-2"
                              />
                              <div className="flex gap-2">
                                <Button onClick={() => handleAddReply(comment.id)} variant="primary" size="sm" disabled={!replyContent.trim()}>
                                  Post Reply
                                </Button>
                                <Button onClick={() => { setReplyingTo(null); setReplyContent(''); }} variant="outline" size="sm">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 pl-3 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="pt-3">
                                  <div className="flex items-start gap-2.5">
                                    <Avatar user={reply.user} size="sm" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1.5">
                                        <button
                                          onClick={() => {
                                            if (reply.user?.id === user?.id) {
                                              navigate('/profile');
                                            } else if (reply.user?.id) {
                                              navigate(`/profile/${reply.user.id}`);
                                            }
                                          }}
                                          className="font-semibold text-sm text-gray-900 dark:text-white hover:text-primary dark:hover:text-blue-400 transition-colors text-left"
                                        >
                                          {reply.user.name}
                                        </button>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {format(new Date(reply.created_at), 'MMM d, yyyy')}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap mb-2">
                                        {reply.content}
                                      </p>
                                      {(user?.id === reply.user.id || user?.id === post.author?.id || user?.roles?.some(r => r.name === 'super_admin')) && (
                                        <button
                                          onClick={() => handleDeleteComment(reply.id)}
                                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline flex items-center gap-1 transition-colors"
                                        >
                                          <FiTrash2 className="w-3.5 h-3.5" />
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <AdSpace size="300x250" ad={postedAds[0]} />
          <AdSpace size="300x250" ad={postedAds[1]} />
        </div>
      </div>
    </div>
  );
}

