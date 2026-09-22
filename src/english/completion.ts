import type { StudentProfile } from "../../types";
import type { EnglishSession, SessionSummary } from "./model";
import { getSession, saveSession } from "./storage";
import { applyCompletion } from "./progress";
import { gachaImage, shouldReceiveImage } from "../../services/albumService";

export interface CompletionResult {
  ok: boolean;
  result?: SessionSummary;
  error?: string;
}
export interface CompletionDependencies {
  readProfiles: () => StudentProfile[];
  writeProfiles: (profiles: StudentProfile[]) => void;
  onSaved: (profiles: StudentProfile[]) => void;
  isOwner: () => boolean;
}
// Web Locks coordinates the localStorage read-modify-write across English tabs.
// IndexedDB revisions independently reject stale draft writes.
export async function completeEnglish(
  owner: string,
  id: string,
  deps: CompletionDependencies,
): Promise<CompletionResult> {
  try {
    if (!navigator.locks)
      throw new Error(
        "Trình duyệt chưa hỗ trợ lưu an toàn giữa các tab. Hãy dùng Chrome, Edge hoặc Safari mới hơn.",
      );
    return await navigator.locks.request(
      "genius-english-profiles",
      async () => {
        if (!deps.isOwner())
          throw new Error("Hồ sơ đã thay đổi. Hãy mở lại bài bằng đúng hồ sơ.");
        let session = await getSession(owner, id);
        if (!session || session.status === "draft")
          throw new Error("Chưa tìm thấy bài đã nộp.");
        let profiles = deps.readProfiles();
        let profile = profiles.find((p) => p.id === owner);
        if (!profile) throw new Error("Hồ sơ không còn tồn tại.");
        const existing = profile.englishProgress?.ledger[id];
        if (existing) {
          deps.onSaved(profiles);
          return { ok: true, result: existing };
        }
        // Persist the random draw BEFORE awarding anything. Retry never redraws.
        if (session.rewardDraw === undefined) {
          const probe = applyCompletion(profile, session);
          const draw =
            session.mode === "test" &&
            !probe.result.rewardLimited &&
            shouldReceiveImage()
              ? gachaImage(profile.ownedImageIds)?.image || null
              : null;
          session = await saveSession(
            { ...session, rewardDraw: draw },
            session.revision,
          );
        }
        // Refresh after asynchronous storage work; commit is synchronous from here.
        if (!deps.isOwner())
          throw new Error("Hồ sơ đã thay đổi. Kết quả chưa được cộng thưởng.");
        profiles = deps.readProfiles();
        profile = profiles.find((p) => p.id === owner);
        if (!profile) throw new Error("Hồ sơ không còn tồn tại.");
        const completed = applyCompletion(profile, session);
        const updated = profiles.map((p) =>
          p.id === owner ? completed.profile : p,
        );
        deps.writeProfiles(updated); // failure must NOT update React or report success
        deps.onSaved(updated);
        try {
          await saveSession(
            { ...session, status: "completed", result: completed.result },
            session.revision,
          );
        } catch {
          /* Atomic profile ledger is authoritative; recover detail on next load. */
        }
        return { ok: true, result: completed.result };
      },
    );
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error ? e.message : "Không thể lưu kết quả. Hãy thử lại.",
    };
  }
}
