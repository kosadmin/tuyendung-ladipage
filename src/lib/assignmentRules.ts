/**
 * ─────────────────────────────────────────────────────────────
 * ASSIGNMENT RULES
 * File này quy định cách tự động gán người phụ trách khi có đơn ứng tuyển mới.
 * Chỉnh sửa tại đây để thay đổi quy tắc mà không cần đụng vào form.
 *
 * Có thể mở rộng sau:
 *   - Gán theo tỉnh thành (address_city)
 *   - Gán theo loại dự án (project_type)
 *   - Gán round-robin theo danh sách nhân viên
 *   - Gán theo ca làm việc (giờ VN hiện tại)
 * ─────────────────────────────────────────────────────────────
 */

export interface AssignedUser {
  assigned_user: string;
  assigned_user_name: string;
  assigned_user_group: string;
}

export interface AssignmentContext {
  project_type?: string;
  address_city?: string;
  /** Giờ VN hiện tại (0-23) — để gán theo ca nếu cần */
  hour?: number;
}

/**
 * Trả về thông tin người phụ trách dựa trên context của đơn ứng tuyển.
 * Hiện đang dùng quy tắc mặc định (KOSAD / KOS Admin / admin).
 */
export function getAssignedUser(context?: AssignmentContext): AssignedUser {
  // ── Quy tắc mặc định ─────────────────────────────────────
  // TODO: Thay bằng logic phức tạp hơn khi cần (gán theo tỉnh, theo loại dự án, v.v.)
  return {
    assigned_user: 'KOSAD',
    assigned_user_name: 'KOS Admin',
    assigned_user_group: 'admin',
  };

  /*
  // ── Ví dụ gán theo tỉnh thành ────────────────────────────
  const cityMap: Record<string, AssignedUser> = {
    'Hà Nội': { assigned_user: 'HN01', assigned_user_name: 'Nguyễn A', assigned_user_group: 'north' },
    'Hồ Chí Minh': { assigned_user: 'HCM01', assigned_user_name: 'Trần B', assigned_user_group: 'south' },
  };
  if (context?.address_city && cityMap[context.address_city]) {
    return cityMap[context.address_city];
  }
  return { assigned_user: 'KOSAD', assigned_user_name: 'KOS Admin', assigned_user_group: 'admin' };
  */
}
