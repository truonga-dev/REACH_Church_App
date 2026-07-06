'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CellGroup, CellGroupMember } from '@/types';
import { Users, MapPin, Clock, Search, Shield, ArrowLeft } from 'lucide-react';
import './page.css';
import BottomNav from '@/components/BottomNav';
import { GroupsSkeleton } from '@/components/ui/Skeleton';
import { useLanguage } from '@/contexts/LanguageContext';

export default function GroupsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-group'>('discover');
  const [groups, setGroups] = useState<CellGroup[]>([]);
  const [myMemberships, setMyMemberships] = useState<CellGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null);  
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    // Fetch all groups
    const { data: groupsData, error: groupsError } = await supabase
      .from('cell_groups')
      .select('*, leader:leader_id(id, full_name, avatar_url)');
    
    if (!groupsError && groupsData) {
      setGroups(groupsData as any);  
    }

    // Fetch user memberships if logged in
    if (user) {
      const { data: memberData, error: memberError } = await supabase
        .from('cell_group_members')
        .select('*, group:group_id(*)')
        .eq('user_id', user.id);
      
      if (!memberError && memberData) {
        setMyMemberships(memberData as any);  
        // Automatically switch to 'my-group' tab if they have a group
        if (memberData.length > 0) {
          setActiveTab('my-group');
        }
      }
    }
    
    setLoading(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if already requested or joined
    if (myMemberships.some(m => m.group_id === groupId)) {
      showToast(t('page_groups.toast_req_sent'));
      return;
    }

    showToast(t('page_groups.toast_sending'));
    const { error } = await supabase
      .from('cell_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: 'pending' // Requires leader approval
      });

    if (error) {
      showToast(t('page_groups.toast_error'));
      console.error(error);
    } else {
      showToast(t('page_groups.toast_join_success'));
      loadData(); // Reload to update UI
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm(t('page_groups.confirm_leave'))) return;
    
    showToast(t('page_groups.toast_leaving'));
    const { error } = await supabase
      .from('cell_group_members')
      .delete()
      .match({ group_id: groupId, user_id: user?.id });

    if (error) {
      showToast(t('page_groups.toast_leave_error'));
      console.error(error);
    } else {
      showToast(t('page_groups.toast_left'));
      setActiveTab('discover');
      loadData();
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="groups-container">
      {toast && <div className="groups-toast">{toast}</div>}

      <div className="groups-header">
        <Link href="/" className="groups-back-btn">
          <ArrowLeft size={24} />
        </Link>
        <h1>{t('page_groups.title')}</h1>
        <p className="groups-subtitle">{t('page_groups.subtitle')}</p>
      </div>

      <div className="groups-tabs">
        <button 
          className={`groups-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          {t('page_groups.tab_discover')}
        </button>
        <button 
          className={`groups-tab ${activeTab === 'my-group' ? 'active' : ''}`}
          onClick={() => {
            if (!user) router.push('/login');
            else setActiveTab('my-group');
          }}
        >
          {t('page_groups.tab_my_group')}
        </button>
      </div>

      <div className="groups-content">
        {loading ? (
          <GroupsSkeleton />
        ) : activeTab === 'discover' ? (
          <div className="discover-tab">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder={t('page_groups.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>{t('page_groups.empty_search')}</p>
              </div>
            ) : (
              <div className="groups-list">
                {filteredGroups.map(group => {
                  const myMembership = myMemberships.find(m => m.group_id === group.id);
                  
                  return (
                    <div key={group.id} className="group-card">
                      <div className="group-card-header">
                        <h2>{group.name}</h2>
                        {myMembership && (
                          <span className={`status-badge ${myMembership.status}`}>
                            {myMembership.status === 'pending' ? t('page_groups.status_pending') : t('page_groups.status_member')}
                          </span>
                        )}
                      </div>
                      
                      {group.description && (
                        <p className="group-desc">{group.description}</p>
                      )}
                      
                      <div className="group-info-row">
                        <Clock size={16} /> <span>{group.meeting_time || t('page_groups.time_not_updated')}</span>
                      </div>
                      <div className="group-info-row">
                        <MapPin size={16} /> <span>{group.location || t('page_groups.location_not_updated')}</span>
                      </div>
                      
                      {group.leader && (
                        <div className="group-leader">
                          <Image 
                            src={(group.leader as any).avatar_url || 'https://via.placeholder.com/150'}   
                            alt="Leader Avatar" 
                            width={32}
                            height={32}
                            unoptimized
                          />
                          <span>{t('page_groups.leader_prefix')} {(group.leader as any).full_name}</span> // eslint-disable-line @typescript-eslint/no-explicit-any
                        </div>
                      )}

                      {!myMembership && (
                        <button className="btn-join" onClick={() => handleJoinGroup(group.id)}>
                          {t('page_groups.btn_join')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="my-group-tab">
            {myMemberships.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>{t('page_groups.empty_my_groups')}</p>
                <button className="btn-primary" onClick={() => setActiveTab('discover')}>
                  {t('page_groups.btn_discover')}
                </button>
              </div>
            ) : (
              <div className="my-groups-list">
                {myMemberships.map(membership => {
                  const group = membership.group;
                  if (!group) return null;

                  return (
                    <div key={membership.id} className="my-group-detail-card">
                      <div className="my-group-header">
                        <h2>{group.name}</h2>
                        <span className={`role-badge ${membership.role}`}>
                          {membership.role === 'leader' ? t('page_groups.role_leader') : membership.role === 'co_leader' ? t('page_groups.role_co_leader') : t('page_groups.role_member')}
                        </span>
                      </div>
                      
                      {membership.status === 'pending' && (
                        <div className="pending-notice">
                          <Shield size={16} /> {t('page_groups.pending_notice')}
                        </div>
                      )}

                      <div className="my-group-details">
                        <div className="detail-item">
                          <Clock size={18} />
                          <div>
                            <strong>{t('page_groups.time_label')}</strong>
                            <p>{group.meeting_time || t('page_groups.time_not_updated')}</p>
                          </div>
                        </div>
                        <div className="detail-item">
                          <MapPin size={18} />
                          <div>
                            <strong>{t('page_groups.location_label')}</strong>
                            <p>{group.location || t('page_groups.location_not_updated')}</p>
                          </div>
                        </div>
                      </div>

                      <div className="my-group-actions">
                        <button className="btn-danger" onClick={() => handleLeaveGroup(group.id)}>
                          {t('page_groups.btn_leave')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
