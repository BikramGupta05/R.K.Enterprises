function SellingHistoryTabs({ activeTab, onChange }) {
  const tabs = [
    {
      id: "all",
      label: "All Sales",
    },
    {
      id: "seller",
      label: "By Seller",
    },
    {
      id: "item",
      label: "By Item",
    },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`min-w-[140px] flex-1 border-b-2 px-6 py-4 text-sm font-semibold transition ${
                isActive
                  ? "border-slate-900 bg-slate-50 text-slate-900"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SellingHistoryTabs;
