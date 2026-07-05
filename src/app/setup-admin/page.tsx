'use client';

import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from '@/lib/profile-service';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupAdminPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  if (!user) {
    return (
      <div className="p-8 text-center text-white">
        <h1>Vui lòng đăng nhập trước</h1>
        <p>Bạn phải tạo tài khoản với email reachchurch2017@gmail.com và đăng nhập trước khi cấp quyền.</p>
        <button 
          onClick={() => router.push('/login')}
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
        >
          Đến trang Đăng nhập / Đăng ký
        </button>
      </div>
    );
  }

  const handleElevate = async () => {
    setLoading(true);
    setMessage('Đang xử lý...');
    try {
      const success = await updateProfile(user.id, { role: 'Quản trị viên' });
      if (success) {
        setMessage('Thành công! Bạn đã được cấp quyền Quản trị viên.');
        await refreshProfile();
        setTimeout(() => {
          router.push('/admin');
        }, 2000);
      } else {
        setMessage('Lỗi: Không thể cập nhật quyền. Có thể do RLS chặn.');
      }
    } catch (e: any) {  
      setMessage('Lỗi: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto mt-20 bg-gray-800 text-white rounded shadow text-center">
      <h1 className="text-xl font-bold mb-4">Cấp Quyền Admin</h1>
      <p className="mb-4 text-gray-300">
        Email hiện tại: <strong className="text-white">{user.email}</strong>
      </p>
      <p className="mb-6 text-sm text-yellow-400">
        Lưu ý: Chỉ sử dụng trang này một lần. Sau khi cấp quyền thành công, trang này nên được xóa bỏ.
      </p>
      <button
        onClick={handleElevate}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition disabled:opacity-50"
      >
        {loading ? 'Đang cấp quyền...' : 'Cấp Quyền Quản Trị Viên'}
      </button>
      {message && <p className="mt-4 text-sm font-medium">{message}</p>}
    </div>
  );
}
