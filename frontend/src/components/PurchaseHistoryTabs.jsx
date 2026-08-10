function PurchaseHistoryTabs({ activeTab, onChange }) {
  const tabs = [
    {
      id: "all",
      label: "All Purchases",
    },
    {
      id: "buyer",
      label: "By Buyer",
    },
    {
      id: "item",
      label: "By Item",
    },
  ];

  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-lg px-5 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-slate-900 text-white shadow"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

export default PurchaseHistoryTabs;
