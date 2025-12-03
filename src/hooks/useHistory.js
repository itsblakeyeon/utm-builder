import { useReducer, useCallback, useRef, useEffect } from "react";

/**
 * Undo/Redo 기능을 제공하는 상태 관리 훅
 * @param {any} initialState - 초기 상태
 * @param {Object} options - 설정 옵션
 * @param {number} options.maxHistory - 최대 히스토리 개수 (기본: 50)
 * @param {number} options.debounceMs - 디바운스 시간 (기본: 500ms)
 * @param {Function} options.onUndoRedo - undo/redo 후 실행할 콜백
 * @returns {[state, setState, controls]} - 상태, setter, undo/redo 컨트롤
 */
export const useHistory = (initialState, options = {}) => {
  const { maxHistory = 50, debounceMs = 500, onUndoRedo = null } = options;

  // 히스토리 reducer
  const historyReducer = (state, action) => {
    switch (action.type) {
      case "SET": {
        return {
          ...state,
          present: action.payload,
        };
      }

      case "RECORD": {
        const newPast = [...state.past, action.payload];
        if (newPast.length > maxHistory) {
          newPast.shift();
        }
        return {
          past: newPast,
          present: state.present,
          future: [],
        };
      }

      case "UNDO": {
        if (state.past.length === 0) {
          return state;
        }

        const previous = state.past[state.past.length - 1];
        const newPast = state.past.slice(0, -1);

        return {
          past: newPast,
          present: previous,
          future: [state.present, ...state.future],
        };
      }

      case "REDO": {
        if (state.future.length === 0) {
          return state;
        }

        const next = state.future[0];
        const newFuture = state.future.slice(1);

        return {
          past: [...state.past, state.present],
          present: next,
          future: newFuture,
        };
      }

      default:
        return state;
    }
  };

  // 초기 상태 계산
  const computedInitialState =
    typeof initialState === "function" ? initialState() : initialState;

  // useReducer로 히스토리 상태 관리
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: computedInitialState,
    future: [],
  });

  // undo/redo 중인지 플래그
  const isUndoRedoActionRef = useRef(false);

  // 딥클론 헬퍼
  const cloneState = useCallback((state) => {
    return structuredClone(state);
  }, []);

  // 스냅샷 기록 (디바운스 제거: 변경 시마다 즉시 기록)
  const recordSnapshot = useCallback(
    (previousState) => {
      if (isUndoRedoActionRef.current) {
        return;
      }

      dispatch({
        type: "RECORD",
        payload: cloneState(previousState),
      });
    },
    [cloneState]
  );

  // 히스토리 기록하는 setState 래퍼
  const setStateWithHistory = useCallback(
    (newStateOrUpdater) => {
      const currentPresent = state.present;
      const newState =
        typeof newStateOrUpdater === "function"
          ? newStateOrUpdater(currentPresent)
          : newStateOrUpdater;

      // 상태가 변경되지 않았으면 히스토리 기록/업데이트 생략
      if (currentPresent === newState) {
        return;
      }

      // 이전 상태를 히스토리에 저장
      recordSnapshot(currentPresent);

      // 새 상태로 업데이트
      dispatch({
        type: "SET",
        payload: newState,
      });
    },
    [state.present, recordSnapshot]
  );

  // Undo 함수
  const undo = useCallback(() => {
    isUndoRedoActionRef.current = true;

    dispatch({ type: "UNDO" });

    if (onUndoRedo) onUndoRedo();

    requestAnimationFrame(() => {
      isUndoRedoActionRef.current = false;
    });
  }, [onUndoRedo]);

  // Redo 함수
  const redo = useCallback(() => {
    isUndoRedoActionRef.current = true;

    dispatch({ type: "REDO" });

    if (onUndoRedo) onUndoRedo();

    requestAnimationFrame(() => {
      isUndoRedoActionRef.current = false;
    });
  }, [onUndoRedo]);

  return [
    state.present,
    setStateWithHistory,
    {
      undo,
      redo,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      clearHistory: () => {
        dispatch({ type: "CLEAR" });
      },
    },
  ];
};
