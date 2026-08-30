import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader, StatusBadge, Btn, DataTable } from '../components/ui';
import { Users, Search, ShieldAlert, Shield, X, Calendar, Activity, Bookmark, Clock, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Selected User Details state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Debounced search term state
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    
    let url = `/admin/users?page=${page}&limit=15`;
    if (debouncedSearch.trim()) {
      url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
    }
    if (roleFilter !== 'ALL') {
      url += `&role=${roleFilter}`;
    }

    api.get<any>(url)
      .then(res => {
        if (res.success && res.data) {
          setUsers(res.data.users || []);
          setTotalPages(res.data.pages || 1);
          setTotalUsers(res.data.total || 0);
        } else {
          setError(res.error?.message || 'Failed to fetch user directory.');
        }
      })
      .catch(err => {
        setError(err.message || 'An error occurred while communicating with the server.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch details when selecting a user
  useEffect(() => {
    if (!selectedUserId) {
      setUserDetails(null);
      return;
    }
    setLoadingDetails(true);
    setDetailsError(null);

    api.get<any>(`/admin/users/${selectedUserId}`)
      .then(res => {
        if (res.success && res.data) {
          setUserDetails(res.data);
        } else {
          setDetailsError(res.error?.message || 'Failed to retrieve account details.');
        }
      })
      .catch(err => {
        setDetailsError(err.message || 'Error loading user details.');
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [selectedUserId]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Safe table column definitions
  const columns = [
    { 
      key: 'avatar', 
      header: '', 
      render: (_: any, row: any) => {
        const initials = row.name ? row.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';
        return (
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: row.role === 'ADMIN' ? 'linear-gradient(135deg, #00D8F6, #6366F1)' : 'var(--bg-elevation-2)',
            border: row.role === 'ADMIN' ? '1px solid var(--primary-border)' : '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: row.role === 'ADMIN' ? '#030712' : 'var(--text-secondary)'
          }}>
            {initials}
          </div>
        );
      }
    },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { 
      key: 'role', 
      header: 'Access Level', 
      render: (val: string) => {
        const isAdmin = val === 'ADMIN';
        return (
          <span style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: isAdmin ? 'var(--primary-dim)' : 'var(--bg-elevation-2)',
            color: isAdmin ? 'var(--primary)' : 'var(--text-secondary)',
            border: isAdmin ? '1px solid var(--primary-border)' : '1px solid var(--border)'
          }}>
            {val}
          </span>
        );
      }
    },
    { 
      key: 'created_at', 
      header: 'Joined Date',
      render: (val: string) => formatDate(val)
    },
    {
      key: 'actions',
      header: '',
      render: (_: any, row: any) => (
        <Btn variant="secondary" size="sm" onClick={() => setSelectedUserId(row.id)}>
          Inspect
        </Btn>
      )
    }
  ];

  return (
    <div className="animate-slide" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        category="Admin Workspace"
        title="User Management"
        subtitle="Access system user records, review accounts, and inspect platform activity logs."
      />

      {/* Main card */}
      <div style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        padding: '24px',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Controls Block */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '8px 14px',
            width: '100%',
            maxWidth: '360px',
            transition: 'border-color 0.15s ease'
          }}>
            <Search size={16} color="var(--text-muted)" />
            <input 
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: '13px',
                width: '100%'
              }}
            />
          </div>

          {/* Role Filters */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>Role Filter:</span>
            {['ALL', 'USER', 'ADMIN'].map(r => (
              <button
                key={r}
                onClick={() => { setRoleFilter(r); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid ' + (roleFilter === r ? 'var(--primary-border)' : 'var(--border)'),
                  background: roleFilter === r ? 'var(--primary-dim)' : 'transparent',
                  color: roleFilter === r ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Directory List Area */}
        {loading ? (
          <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Retrieving secure user records...</span>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: 'var(--danger)' }}><ShieldAlert size={32} /></div>
            <div style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>{error}</div>
            <Btn variant="secondary" onClick={fetchUsers} icon={<RefreshCw size={12} />}>
              Retry Query
            </Btn>
          </div>
        ) : users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            border: '2px dashed var(--border)',
            borderRadius: '12px',
            color: 'var(--text-muted)'
          }}>
            {debouncedSearch.trim() 
              ? 'No users match your search.' 
              : roleFilter !== 'ALL' 
                ? 'No users found for this role.' 
                : 'No users found.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <DataTable columns={columns} data={users} emptyMessage="No user records returned." />
          </div>
        )}

        {/* Pagination controls */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Showing {users.length} of {totalUsers} registered accounts
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
      </div>

      {/* User Details Drawer Modal */}
      {selectedUserId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 6, 12, 0.75)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}
        onClick={() => setSelectedUserId(null)}
        >
          <div 
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              borderRadius: '20px',
              padding: '30px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative',
              animation: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              onClick={() => setSelectedUserId(null)}
              style={{
                position: 'absolute', top: '20px', right: '20px',
                background: 'transparent', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '4px', borderRadius: '50%'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <X size={18} />
            </button>

            {loadingDetails ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0' }}>
                <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Retrieving profile data...</span>
              </div>
            ) : detailsError ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px 0', textAlign: 'center' }}>
                <ShieldAlert size={28} color="var(--danger)" />
                <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 600 }}>{detailsError}</span>
                <Btn variant="secondary" size="sm" onClick={() => setSelectedUserId(selectedUserId)}>Retry</Btn>
              </div>
            ) : userDetails ? (
              <>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: userDetails.role === 'ADMIN' ? 'linear-gradient(135deg, #00D8F6, #6366F1)' : 'var(--bg-elevation-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 800, color: userDetails.role === 'ADMIN' ? '#030712' : 'var(--text-secondary)',
                    border: userDetails.role === 'ADMIN' ? '1px solid var(--primary-border)' : '1px solid var(--border)'
                  }}>
                    {userDetails.name ? userDetails.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                      {userDetails.name}
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{userDetails.email}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Shield size={13} /> Privilege Level:</span>
                    <span style={{
                      fontWeight: 700,
                      color: userDetails.role === 'ADMIN' ? 'var(--primary)' : 'var(--text-secondary)',
                      background: userDetails.role === 'ADMIN' ? 'var(--primary-dim)' : 'transparent',
                      padding: userDetails.role === 'ADMIN' ? '2px 8px' : '0',
                      borderRadius: '4px'
                    }}>{userDetails.role}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={13} /> Joined Date:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatDate(userDetails.created_at)}</span>
                  </div>
                  {userDetails.updated_at && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={13} /> Last Profile Update:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatDate(userDetails.updated_at)}</span>
                    </div>
                  )}
                </div>

                {/* Aggregate Statistics Block */}
                <div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Audit & Telemetry Activity
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ color: 'var(--primary)', marginBottom: '6px' }}><Activity size={16} /></div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                        {userDetails.stats?.total_analyses || 0}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>Analyses Scanned</div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ color: 'var(--primary)', marginBottom: '6px' }}><Bookmark size={16} /></div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                        {userDetails.stats?.saved_jobs_count || 0}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>Saved Opportunities</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <Btn variant="secondary" onClick={() => setSelectedUserId(null)}>
                    Dismiss Details
                  </Btn>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
