import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PageHeader, StatusBadge, Btn, DataTable } from '../components/ui';
import { RefreshCw, X, ShieldAlert, LifeBuoy, User } from 'lucide-react';
import { api } from '../services/api';

export function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);

  // Selected Ticket details state
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTickets = useCallback(() => {
    setLoading(true);
    setError(null);
    
    let url = `/admin/support/tickets?page=${page}&limit=15`;
    if (statusFilter !== 'ALL') {
      url += `&status=${statusFilter}`;
    }

    api.get<any>(url)
      .then(res => {
        if (res.success && res.data) {
          setTickets(res.data.items || []);
          setTotalPages(res.data.pagination?.pages || 1);
          setTotalTickets(res.data.pagination?.total || 0);
        } else {
          setError(res.error?.message || 'Failed to fetch support tickets.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while communicating with the server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, statusFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTicket]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTicket(null);
      }
    };
    if (selectedTicket) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTicket]);

  const handleUpdateStatus = (ticketId: string, newStatus: string) => {
    setUpdatingStatus(true);
    api.put<any>(`/admin/support/tickets/${ticketId}`, { status: newStatus })
      .then(res => {
        if (res.success) {
          triggerToast('Ticket status updated successfully.', 'success');
          // Update local status in selectedTicket if currently viewing it
          if (selectedTicket && selectedTicket.id === ticketId) {
            setSelectedTicket((prev: any) => ({ ...prev, status: newStatus }));
          }
          // Refresh list
          fetchTickets();
        } else {
          triggerToast(res.error?.message || 'Failed to update ticket status.', 'error');
        }
      })
      .catch(err => {
        triggerToast(err.message || 'Error updating ticket status.', 'error');
      })
      .finally(() => {
        setUpdatingStatus(false);
      });
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const columns = [
    { 
      key: 'subject', 
      header: 'Subject & User info',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{row.subject}</span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            by {row.user_name} ({row.user_email})
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val: string) => {
        const badgeMap: Record<string, 'safe' | 'warning' | 'neutral'> = {
          OPEN: 'warning',
          IN_PROGRESS: 'neutral',
          RESOLVED: 'safe'
        };
        return <StatusBadge status={badgeMap[val] || 'neutral'} label={val === 'IN_PROGRESS' ? 'IN PROGRESS' : val} />;
      }
    },
    { 
      key: 'created_at', 
      header: 'Submitted At',
      render: (val: string) => formatDate(val)
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: any) => (
        <Btn variant="secondary" size="sm" onClick={() => setSelectedTicket(row)}>
          View Details
        </Btn>
      )
    }
  ];

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
      
      {/* Toast popup */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 1000,
          padding: '12px 20px', borderRadius: '10px',
          background: toast.type === 'success' ? 'var(--safe-dim)' : 'var(--danger-dim)',
          border: `1px solid ${toast.type === 'success' ? 'var(--safe-border)' : 'var(--danger-border)'}`,
          color: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          fontSize: '13.5px', fontWeight: 600, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}

      <PageHeader 
        title="Support Tickets" 
        subtitle="Manage and resolve user questions and bug reports" 
        category="Platform Administration"
        action={
          <Btn variant="secondary" size="sm" onClick={fetchTickets} icon={<RefreshCw size={13} />}>
            Refresh
          </Btn>
        }
      />

      {/* Filter and Count ribbon */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-glass)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '12px 20px', gap: '16px', flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: '1px solid transparent',
                background: statusFilter === st ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              {st === 'IN_PROGRESS' ? 'IN PROGRESS' : st}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Found <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{totalTickets}</span> support tickets
        </div>
      </div>

      {/* List Area */}
      {loading ? (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving support tickets...</span>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'var(--danger)' }}><ShieldAlert size={32} /></div>
          <div style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>{error}</div>
          <Btn variant="secondary" onClick={fetchTickets} icon={<RefreshCw size={12} />}>
            Retry Query
          </Btn>
        </div>
      ) : tickets.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 0',
          border: '2px dashed var(--border)',
          borderRadius: '12px',
          color: 'var(--text-muted)'
        }}>
          {statusFilter !== 'ALL' 
            ? 'No support tickets match this status filter.' 
            : 'No support tickets found.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <DataTable columns={columns} data={tickets} emptyMessage="No support tickets returned." />
        </div>
      )}

      {/* Pagination controls */}
      {!loading && !error && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Showing {tickets.length} of {totalTickets} support tickets
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Btn 
              variant="secondary" 
              size="sm" 
              disabled={page <= 1} 
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Btn>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </div>
            <Btn 
              variant="secondary" 
              size="sm" 
              disabled={page >= totalPages} 
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Btn>
          </div>
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selectedTicket && createPortal(
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5,6,12,0.85)',
          backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 24
        }} onClick={() => setSelectedTicket(null)}>
          <div className="animate-scale" style={{
            background: 'linear-gradient(135deg, #0B131F 0%, #070D18 100%)',
            border: '1px solid rgba(0, 216, 246, 0.25)',
            borderRadius: '20px', width: 'min(600px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 40px rgba(0, 216, 246, 0.08)',
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '28px 36px 20px 36px', borderBottom: '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(0,216,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00D8F6', border: '1px solid rgba(0,216,246,0.2)' }}>
                  <LifeBuoy size={20} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Support Ticket Details</h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)} 
                aria-label="Close ticket details"
                title="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                  e.currentTarget.style.color = '#EF4444';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                &times;
              </button>
            </div>

            {/* Scrollable Middle Content area */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '24px 36px',
              display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              {/* Ticket ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ticket ID
                </span>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '12px 18px', fontSize: '13.5px', color: 'var(--text)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  <span>{selectedTicket.id}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTicket.id);
                      triggerToast('Ticket ID copied to clipboard!', 'success');
                    }}
                    title="Copy ID"
                    style={{
                      background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
                      borderRadius: '6px', transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 216, 246, 0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* User Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  User Details
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: 'var(--text)' }}>
                  <User size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 600 }}>{selectedTicket.user_name}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>({selectedTicket.user_email})</span>
                </div>
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Subject
                </span>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                  {selectedTicket.subject}
                </span>
              </div>

              {/* Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Message
                </span>
                <div style={{
                  background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px 20px', color: 'var(--text)',
                  fontSize: '13.5px', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedTicket.message}
                </div>
              </div>

              {/* Submitted At / Status */}
              <div style={{ display: 'flex', gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Submitted At
                  </span>
                  <span style={{ fontSize: '12.5px', color: 'var(--text)' }}>
                    {formatDate(selectedTicket.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Current Status
                  </span>
                  <div>
                    <StatusBadge 
                      status={selectedTicket.status === 'OPEN' ? 'warning' : selectedTicket.status === 'IN_PROGRESS' ? 'neutral' : 'safe'} 
                      label={selectedTicket.status === 'IN_PROGRESS' ? 'IN PROGRESS' : selectedTicket.status} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Static Action buttons footer */}
            <div style={{
              borderTop: '1px solid var(--border)', padding: '24px 36px 36px 36px',
              display: 'flex', flexDirection: 'column', gap: '12px'
            }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Update Ticket Status
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    disabled={updatingStatus || selectedTicket.status === st}
                    onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 700,
                      cursor: updatingStatus || selectedTicket.status === st ? 'not-allowed' : 'pointer',
                      border: '1px solid transparent', transition: 'all 0.15s ease',
                      background: selectedTicket.status === st 
                        ? (st === 'OPEN' ? 'rgba(245,158,11,0.18)' : st === 'IN_PROGRESS' ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.18)')
                        : 'rgba(255,255,255,0.02)',
                      color: selectedTicket.status === st 
                        ? (st === 'OPEN' ? '#F59E0B' : st === 'IN_PROGRESS' ? 'var(--text)' : '#10B981')
                        : 'var(--text-secondary)',
                      borderColor: selectedTicket.status === st 
                        ? (st === 'OPEN' ? 'rgba(245,158,11,0.3)' : st === 'IN_PROGRESS' ? 'rgba(255,255,255,0.12)' : 'rgba(16,185,129,0.3)')
                        : 'var(--border)'
                    }}
                  >
                    {st === 'IN_PROGRESS' ? 'IN PROGRESS' : st}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
