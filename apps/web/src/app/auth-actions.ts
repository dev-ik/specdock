import type { AuthProfile } from "@specdock/core";
import { createAuthProfile } from "./auth-profiles.js";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;

export const createAuthActions = (state: State) => {
  const addAuthProfile = (type: AuthProfile["type"]) => {
    if (!state.activeProject) {
      state.setStatus("Import a spec before adding auth profiles.");
      return;
    }

    const profile = createAuthProfile(state.activeProject.id, type);
    saveProfiles(state, [profile, ...state.authProfiles]);
    state.setStatus(`Added ${profile.name}`);
  };

  const updateAuthProfile = (
    profileId: string,
    patch: Partial<Pick<AuthProfile, "name" | "values">>
  ) => {
    const now = new Date().toISOString();
    const nextProfiles = state.authProfiles.map((profile) =>
      profile.id === profileId
        ? {
            ...profile,
            ...patch,
            values: patch.values
              ? { ...profile.values, ...patch.values }
              : profile.values,
            updatedAt: now
          }
        : profile
    );
    saveProfiles(state, nextProfiles);
  };

  const deleteAuthProfile = (profileId: string) => {
    saveProfiles(
      state,
      state.authProfiles.filter((profile) => profile.id !== profileId)
    );
    state.setRequestStates((current) =>
      Object.fromEntries(
        Object.entries(current).map(([key, requestState]) => [
          key,
          requestState.authProfileId === profileId
            ? { ...requestState, authProfileId: undefined }
            : requestState
        ])
      )
    );
    state.setStatus("Auth profile deleted");
  };

  return {
    addAuthProfile,
    updateAuthProfile,
    deleteAuthProfile
  };
};

const saveProfiles = (
  state: State,
  authProfiles: AuthProfile[]
): void => {
  state.storageAdapter.saveAuthProfiles(authProfiles);
  state.setAuthProfiles(authProfiles);
};
