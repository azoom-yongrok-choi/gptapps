import React from "react";
import { X } from "lucide-react";

export default function FilterModal({ isOpen, onClose, onApply, filters, setFilters }) {
  if (!isOpen) return null;

  // 가격 옵션 생성: 5000원부터 50000원까지 5000원 단위
  const priceOptions = React.useMemo(() => {
    const options = [];
    for (let i = 5000; i <= 50000; i += 5000) {
      options.push(i);
    }
    return options;
  }, []);

  const handleCheckboxChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [value]: !prev[category]?.[value]
      }
    }));
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      price: {
        ...prev.price,
        [type]: Number(value)
      }
    }));
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={(e) => {
          e.stopPropagation();
        }}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">条件を指定して絞り込む</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="bg-green-50 p-2 grid grid-cols-2 gap-4">
            {/* 賃料*/}
            <div className="bg-white rounded-lg flex gap-4">
                <div className="bg-green-600 h-full text-white p-2 rounded font-medium min-w-[120px] flex items-center justify-center">
                  賃料
                </div>
                <div className="flex items-center gap-2 flex-1 flex-wrap content-center">
                  <select
                    value={filters.price?.min === -Infinity ? "-Infinity" : filters.price?.min}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 bg-white"
                  >
                    <option value="-Infinity">下限なし</option>
                    {priceOptions.map(price => (
                      <option key={price} value={price}>
                        {price.toLocaleString()}円
                      </option>
                    ))}
                  </select>
                  <span>〜</span>
                  <select
                    value={filters.price?.max === Infinity ? "Infinity" : filters.price?.max}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 bg-white"
                  >
                    <option value="Infinity">上限なし</option>
                    {priceOptions.map(price => (
                      <option key={price} value={price}>
                        {price.toLocaleString()}円
                      </option>
                    ))}
                  </select>
                  <span>円</span>
                </div>
            </div>

            {/* 収容サイズ */}
            <div className="bg-white rounded-lg flex gap-4">
            <div className="bg-green-600 h-full text-white px-4 py-2 rounded font-medium min-w-[120px] flex items-center justify-center">
                収容サイズ
            </div>
            <div className="flex-1 flex flex-col justify-center py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={filters.size?.large || false}
                    onChange={() => handleCheckboxChange('size', 'large')}
                    className="w-4 h-4 rounded border-gray-300"
                />
                <span className="flex items-center gap-1">
                    大型車
                </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={filters.size?.highRoof || false}
                    onChange={() => handleCheckboxChange('size', 'highRoof')}
                    className="w-4 h-4 rounded border-gray-300"
                />
                <span className="flex items-center gap-1">
                    ハイルーフ
                </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={filters.size?.middleRoof || false}
                    onChange={() => handleCheckboxChange('size', 'middleRoof')}
                    className="w-4 h-4 rounded border-gray-300"
                />
                <span className="flex items-center gap-1">
                    ミドルルーフ
                </span>
                </label>
            </div>
            </div>

            {/* 屋内外 */}
            <div className="bg-white rounded-lg flex gap-4">
            <div className="bg-green-600 h-full text-white px-4 py-2 rounded font-medium min-w-[120px] flex items-center justify-center">
                屋内外
              </div>
              <div className="flex-1 flex flex-col justify-center py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.location?.indoor || false}
                    onChange={() => handleCheckboxChange('location', 'indoor')}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>屋內</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.location?.outdoor || false}
                    onChange={() => handleCheckboxChange('location', 'outdoor')}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>屋外</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.location?.unknown || false}
                    onChange={() => handleCheckboxChange('location', 'unknown')}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>不明含む</span>
                </label>
              </div>
            </div>

            {/* 設備 */}
            <div className="bg-white rounded-lg flex gap-4">
                <div className="bg-green-600 h-full text-white px-4 py-2 rounded font-medium min-w-[120px] flex items-center justify-center">
                    設備
                </div>
                <div className="flex-1 flex flex-col justify-center py-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.facility?.flat || false}
                            onChange={() => handleCheckboxChange('facility', 'flat')}
                            className="w-4 h-4 rounded border-gray-300"
                            disabled
                        />
                        <span>平面式</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.facility?.mechanical || false}
                            onChange={() => handleCheckboxChange('facility', 'mechanical')}
                            className="w-4 h-4 rounded border-gray-300"
                            disabled
                        />
                        <span>機械式</span>
                    </label>
                </div>
            </div>

            {/* その他 */}
            <div className="bg-white rounded-lg flex gap-4">
                <div className="bg-green-600 h-full text-white px-4 py-2 rounded font-medium min-w-[120px] flex items-center justify-center">
                    その他
                </div>
                <div className="flex-1 flex flex-col justify-center py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.other?.allDay || false}
                    onChange={() => handleCheckboxChange('other', 'allDay')}
                    className="w-4 h-4 rounded border-gray-300"
                    disabled
                  />
                  <span>24時間利用可能</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.other?.truckParking || false}
                    onChange={() => handleCheckboxChange('other', 'truckParking')}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>トラック駐車可能</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.other?.newListing || false}
                    onChange={() => handleCheckboxChange('other', 'newListing')}
                    className="w-4 h-4 rounded border-gray-300"
                    disabled
                  />
                  <span>新着</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.other?.evCharging || false}
                    onChange={() => handleCheckboxChange('other', 'evCharging')}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>EV充電可能</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t flex justify-center">
            <button
              onClick={onApply}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-32 py-3 rounded-lg transition-colors text-lg w-full max-w-xl cursor-pointer"
              type="button"
            >
              検索する
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
