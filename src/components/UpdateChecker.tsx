'use client';

import { useEffect, useState, useCallback } from 'react';

const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || '0';

export default function UpdateChecker() {
  const [showUpdate, setShowUpdate] = useState(false);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.buildId && data.buildId !== CURRENT_BUILD_ID) {
        setShowUpdate(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // 첫 체크는 5초 후
    const timeout = setTimeout(checkForUpdate, 5000);
    // 이후 20초마다 체크
    const interval = setInterval(checkForUpdate, 20000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [checkForUpdate]);

  const handleUpdate = () => {
    setShowUpdate(false);
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="update-bar">
      <span>🔄 새로운 업데이트가 있습니다</span>
      <div className="update-bar-btns">
        <button className="update-btn-apply" onClick={handleUpdate}>업데이트</button>
      </div>
    </div>
  );
}
