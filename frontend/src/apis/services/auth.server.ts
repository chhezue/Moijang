import apiServer from '@/apis/apiServer';
import { withServerCookies } from '@/apis/utils/withServerCookies';
import type { UserDto } from '@/types/auth';

export const getMyInfoServer = async (): Promise<UserDto> => {
  const res = await apiServer.get('/api/auth/me', {
    headers: withServerCookies(),
  });
  return res.data;
};
