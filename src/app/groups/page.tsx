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

export default function GroupsPage() {
  const router = useRouter();
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
      showToast('Bạn đã gửi yêu cầu hoặc đã tham gia nhóm này.');
      return;
    }

    showToast('Đang gửi yêu cầu...');
    const { error } = await supabase
      .from('cell_group_members')
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: 'member',
        status: 'pending' // Requires leader approval
      });

    if (error) {
      showToast('Có lỗi xảy ra, vui lòng thử lại.');
      console.error(error);
    } else {
      showToast('Đã gửi yêu cầu tham gia thành công!');
      loadData(); // Reload to update UI
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!confirm('Bạn có chắc chắn muốn rời nhóm này?')) return;
    
    showToast('Đang rời nhóm...');
    const { error } = await supabase
      .from('cell_group_members')
      .delete()
      .match({ group_id: groupId, user_id: user?.id });

    if (error) {
      showToast('Có lỗi xảy ra.');
      console.error(error);
    } else {
      showToast('Đã rời nhóm.');
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
        <h1>Nhóm nhỏ</h1>
        <p className="groups-subtitle">Kết nối và phát triển tâm linh cùng nhau</p>
      </div>

      <div className="groups-tabs">
        <button 
          className={`groups-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Khám phá
        </button>
        <button 
          className={`groups-tab ${activeTab === 'my-group' ? 'active' : ''}`}
          onClick={() => {
            if (!user) router.push('/login');
            else setActiveTab('my-group');
          }}
        >
          Nhóm của tôi
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
                placeholder="Tìm kiếm tên nhóm, khu vực..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredGroups.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>Không tìm thấy nhóm nào.</p>
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
                            {myMembership.status === 'pending' ? 'Chờ duyệt' : 'Thành viên'}
                          </span>
                        )}
                      </div>
                      
                      {group.description && (
                        <p className="group-desc">{group.description}</p>
                      )}
                      
                      <div className="group-info-row">
                        <Clock size={16} /> <span>{group.meeting_time || 'Chưa cập nhật thời gian'}</span>
                      </div>
                      <div className="group-info-row">
                        <MapPin size={16} /> <span>{group.location || 'Chưa cập nhật địa điểm'}</span>
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
                          <span>Đ/c {(group.leader as any).full_name}</span> // eslint-disable-line @typescript-eslint/no-explicit-any
                        </div>
                      )}

                      {!myMembership && (
                        <button className="btn-join" onClick={() => handleJoinGroup(group.id)}>
                          Xin tham gia
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
                <p>Bạn chưa tham gia nhóm nào.</p>
                <button className="btn-primary" onClick={() => setActiveTab('discover')}>
                  Khám phá ngay
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
                          {membership.role === 'leader' ? 'Trưởng nhóm' : membership.role === 'co_leader' ? 'Phó nhóm' : 'Thành viên'}
                        </span>
                      </div>
                      
                      {membership.status === 'pending' && (
                        <div className="pending-notice">
                          <Shield size={16} /> Yêu cầu tham gia của bạn đang chờ trưởng nhóm phê duyệt.
                        </div>
                      )}

                      <div className="my-group-details">
                        <div className="detail-item">
                          <Clock size={18} />
                          <div>
                            <strong>Thời gian nhóm lại</strong>
                            <p>{group.meeting_time || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                        <div className="detail-item">
                          <MapPin size={18} />
                          <div>
                            <strong>Địa điểm</strong>
                            <p>{group.location || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="my-group-actions">
                        <button className="btn-danger" onClick={() => handleLeaveGroup(group.id)}>
                          Rời nhóm
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
