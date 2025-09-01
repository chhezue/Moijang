import apiServer from "@/apis/apiServer";
import { IParticipant } from "@/apis/interfaces";

export const getParticipantListServer = async (
  gbId: string
): Promise<{ items: IParticipant[] }> => {
  const res = await apiServer.get(`/api/participant/${gbId}`);
  const participants = Array.isArray(res.data) ? res.data : [];
  return { items: participants };
};
