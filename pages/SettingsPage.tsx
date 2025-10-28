
import React, { useState } from "react";
import { JournalEntry } from "../types"; // 引入類型以供類型檢查

const SettingsPage: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  // 📤 匯出資料
  const handleExport = () => {
    try {
      const data = {
        journalEntries: JSON.parse(localStorage.getItem("journalEntries") || "[]"),
        prayerItems: JSON.parse(localStorage.getItem("prayerItems") || "[]"),
        jesusSaidCards: JSON.parse(localStorage.getItem("jesusSaidCards") || "[]"),
        messageNotes: JSON.parse(localStorage.getItem("messageNotes") || "[]"),
        smallGroupShares: JSON.parse(localStorage.getItem("smallGroupShares") || "[]"),
        biblePlansProgress: JSON.parse(localStorage.getItem("biblePlansProgress") || "{}"),
        gracePoints: JSON.parse(localStorage.getItem("gracePoints") || "0"),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Abide-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setImportStatus("✅ 匯出成功！");
      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      console.error(error);
      setImportStatus("❌ 匯出失敗，請稍後再試。");
    }
  };

  // 📥 匯入資料
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (!file) return;

    fileInput.value = "";
    setIsImporting(true);
    setImportStatus("正在讀取檔案...");

    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      setImportStatus("正在處理資料...");

      // --- 規則 1 & 3: 覆蓋模式 (Grace Points & Bible Plans Progress) ---
      if (typeof importedData.gracePoints === "number") {
        localStorage.setItem("gracePoints", JSON.stringify(importedData.gracePoints));
      }
      if (importedData.biblePlansProgress) {
        localStorage.setItem("biblePlansProgress", JSON.stringify(importedData.biblePlansProgress));
      }

      // --- 規則 2: 合併模式 (日記、禱告等主要資料) ---
      const itemKeys = [
        "journalEntries", "prayerItems", "jesusSaidCards",
        "messageNotes", "smallGroupShares",
      ] as const;
      
      let finalJournalEntries: JournalEntry[] | null = null;

      itemKeys.forEach((key) => {
        const importedItems = importedData[key] || [];
        if (!Array.isArray(importedItems)) return;

        const existingItems = JSON.parse(localStorage.getItem(key) || "[]");
        const mergedItemsMap = new Map(existingItems.map((item: any) => [item.id, item]));
        importedItems.forEach((item: any) => {
          if (item.id) mergedItemsMap.set(item.id, item);
        });
        
        const mergedItems = Array.from(mergedItemsMap.values());
        localStorage.setItem(key, JSON.stringify(mergedItems));
        
        // 儲存合併後的日記資料，以供後續計算進度
        if (key === "journalEntries") {
          finalJournalEntries = mergedItems as JournalEntry[];
        }
      });

      // --- 規則 4: 根據合併後的日記，更新聖經進度 ---
      if (finalJournalEntries) {
        const progress: Record<string, Record<string, boolean>> = {};
        finalJournalEntries.forEach((entry) => {
          if (entry.completed && entry.book && entry.chapter) {
            if (!progress[entry.book]) progress[entry.book] = {};
            progress[entry.book][String(entry.chapter)] = true;
          }
        });
        localStorage.setItem("bibleTrackerProgress", JSON.stringify(progress));
        console.log("✅ 已根據合併後的日記資料，同步更新聖經進度。");
      }

      setImportStatus("✅ 匯入成功！系統將於 2 秒後重新整理。");
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      console.error(error);
      setImportStatus(
        `❌ 匯入失敗：${error instanceof Error ? error.message : "無效的 JSON 檔案。"}`
      );
      setIsImporting(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gold-dark"></h1>
        <p className="text-gray-900 text-[16px] mt-6">管理您的應用程式資料</p>
      </div>

      <div className="space-y-6">
        {/* Export Card */}
        <div className="bg-beige-50 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl" aria-hidden="true">
              📩
            </span>
            <div>
              <h2 className="text-xl font-semibold">匯出資料</h2>
              <p className="text-sm text-gray-600 mt-1">
                將您所有的靈修日記、禱告清單等資料，打包成一個 JSON 檔案下載備份。
              </p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="w-full py-3 px-4 bg-beige-200 rounded-lg font-semibold transition hover:bg-beige-300 flex items-center justify-center gap-2"
          >
            <span>下載備份檔案</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-beige-50 rounded-2xl shadow-lg p-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl" aria-hidden="true">
              💻
            </span>
            <div>
              <h2 className="text-xl font-semibold">匯入資料</h2>
              <p className="text-sm text-gray-600 mt-1">
                從備份檔案還原您的資料。匯入將智慧合併您的紀錄，並根據您的日記更新聖經進度。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gold-light/30 text-gold-dark rounded-lg text-sm">
            <span className="text-lg">⚠️</span>
            <p>恩典值與讀經計畫進度將被直接覆蓋，請確認後再操作。</p>
          </div>

          <label className="block w-full">
            <span
              className={`w-full py-3 px-4 bg-beige-200 rounded-lg font-semibold text-center cursor-pointer block transition hover:bg-beige-300 flex items-center justify-center gap-2 ${
                isImporting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <span>選擇 JSON 備份檔</span>
            </span>
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* Status Message */}
      {importStatus && (
        <div
          className={`mt-6 text-center text-sm p-3 rounded-lg transition-opacity duration-300 ${
            importStatus.includes("成功")
              ? "bg-green-100 text-green-800"
              : importStatus.includes("失敗")
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          <p>{importStatus}</p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
