import React, { useState, useRef, useEffect, useMemo } from "react";
import { X } from "lucide-react";

export default function ContactForm({ placeId, isOpen = false, onClose }) {
  const isDetailPage = false;

  if (!isOpen) return null;

  const [pickupForm, setPickupForm] = useState({
    userName: "",
    companyName: "",
    mail: "",
    tel: "",
    postalCode: "",
    addressPrefectureId: "",
    addressPrefectureName: "",
    addressCityName: "",
    addressRegionName: "",
    addressDetail: "",
    searchMin: "",
    carModel: "",
    comment: "",
    noticeMessageAllowed: false,
    searchReason: "",
    useNum: "",
    useTimingYear: "",
    useTimingMonth: "",
    useTimingSeason: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isSaveForm, setIsSaveForm] = useState(false);
  const formRef = useRef(null);
  const countRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const minuteOptions = [1, 3, 5, 10, 15, 20];
  const useNumbers = [1, 2, 3, 5, 10, 20, 30, 50, 100];
  const timingYear = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() + i,
  );
  const timingSeasons = [
    { value: "early", label: "上旬" },
    { value: "middle", label: "中旬" },
    { value: "late", label: "下旬" },
  ];
  const searchReasons = [
    { value: "office", label: "オフィス・事務所" },
    { value: "home", label: "自宅" },
    { value: "commercial", label: "商業施設" },
    { value: "other", label: "その他" },
  ];

  const validateField = (fieldName, value) => {
    let errorMessage = null;
    let isValid = true;

    switch (fieldName) {
      case "userName":
        if (!value || value.trim() === "") {
          errorMessage = "お名前を入力してください";
          isValid = false;
        } else if (value.length > 50) {
          errorMessage = "50文字以内で入力してください";
          isValid = false;
        }
        break;

      case "mail":
        if (!value || value.trim() === "") {
          errorMessage = "メールアドレスを入力してください";
          isValid = false;
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errorMessage = "正しいメールアドレスを入力してください";
            isValid = false;
          } else if (value.length > 254) {
            errorMessage = "254文字以内で入力してください";
            isValid = false;
          }
        }
        break;

      case "tel":
        if (!value || value.trim() === "") {
          errorMessage = "電話番号を入力してください";
          isValid = false;
        } else {
          const telRegex = /^[\d-]+$/;
          const cleanValue = value.replace(/\s/g, "");
          if (!telRegex.test(cleanValue)) {
            errorMessage = "正しい電話番号を入力してください";
            isValid = false;
          } else if (cleanValue.replace(/\D/g, "").length < 10) {
            errorMessage = "正しい電話番号を入力してください";
            isValid = false;
          }
        }
        break;

      case "postalCode":
        if (!value || value.trim() === "") {
          errorMessage = "郵便番号を入力してください";
          isValid = false;
        } else {
          const postalRegex = /^\d{7}$|^\d{3}-\d{4}$/;
          if (!postalRegex.test(value.replace(/\s/g, ""))) {
            errorMessage = "正しい郵便番号を入力してください（例：1510053）";
            isValid = false;
          }
        }
        break;

      case "addressPrefectureId":
      case "addressPrefectureName":
        if (
          !pickupForm.addressPrefectureId ||
          !pickupForm.addressPrefectureName
        ) {
          errorMessage = "都道府県を選択してください";
          isValid = false;
        }
        break;

      case "addressCityName":
        if (
          !pickupForm.addressCityName ||
          pickupForm.addressCityName.trim() === ""
        ) {
          errorMessage = "市区を入力してください";
          isValid = false;
        }
        break;

      case "addressRegionName":
        if (
          !pickupForm.addressRegionName ||
          pickupForm.addressRegionName.trim() === ""
        ) {
          errorMessage = "町村を入力してください";
          isValid = false;
        }
        break;

      case "addressDetail":
        if (!value || value.trim() === "") {
          errorMessage = "丁目・番地・枝番を入力してください";
          isValid = false;
        } else if (value.length > 50) {
          errorMessage = "50文字以内で入力してください";
          isValid = false;
        }
        break;

      case "searchMin":
        if (!value || value.trim() === "") {
          errorMessage = "徒歩分数を入力してください";
          isValid = false;
        } else {
          const min = parseInt(value, 10);
          if (isNaN(min) || min <= 0 || min > 999) {
            errorMessage = "1〜999の数字を入力してください";
            isValid = false;
          }
        }
        break;

      case "carModel":
        if (!value || value.trim() === "") {
          errorMessage = "契約車種を入力してください";
          isValid = false;
        } else if (value.length > 50) {
          errorMessage = "50文字以内で入力してください";
          isValid = false;
        }
        break;
    }

    setFieldErrors((prevErrors) => {
      const errors = { ...prevErrors };
      if (errorMessage) {
        errors[fieldName] = errorMessage;
      } else {
        delete errors[fieldName];
      }
      return errors;
    });

    return isValid;
  };

  const checkValidField = (fieldName) => {
    if (!touchedFields[fieldName]) return false;
    return !fieldErrors[fieldName];
  };

  const handleBlur = (fieldName) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    const value = pickupForm[fieldName];
    if (
      fieldName === "addressPrefectureId" ||
      fieldName === "addressPrefectureName"
    ) {
      validateField(fieldName, pickupForm.addressPrefectureId);
    } else if (fieldName === "addressCityName") {
      validateField(fieldName, pickupForm.addressCityName);
    } else if (fieldName === "addressRegionName") {
      validateField(fieldName, pickupForm.addressRegionName);
    } else {
      validateField(fieldName, value);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setPickupForm((prev) => {
      const updatedForm = {
        ...prev,
        [name]: newValue,
      };

      if (touchedFields[name]) {
        setTimeout(() => {
          if (
            name === "addressPrefectureId" ||
            name === "addressPrefectureName"
          ) {
            validateField(
              "addressPrefectureId",
              updatedForm.addressPrefectureId,
            );
          } else if (name === "addressCityName") {
            validateField("addressCityName", updatedForm.addressCityName);
          } else if (name === "addressRegionName") {
            validateField("addressRegionName", updatedForm.addressRegionName);
          } else {
            validateField(name, updatedForm[name]);
          }
        }, 0);
      }

      return updatedForm;
    });
  };

  const getAddressFromPostalCode = async () => {
    const postalCode = pickupForm.postalCode.replace(/\D/g, "");
    if (postalCode.length !== 7) {
      setFieldErrors((prev) => ({
        ...prev,
        postalCode: "正しい郵便番号を入力してください",
      }));
      return;
    }

    try {
      const response = await fetch(
        `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setPickupForm((prev) => ({
          ...prev,
          addressPrefectureId: result.prefcode || "",
          addressPrefectureName: result.address1 || "",
          addressCityName: result.address2 || "",
          addressRegionName: result.address3 || "",
        }));
        setFieldErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.postalCode;
          return newErrors;
        });
      } else {
        setFieldErrors((prev) => ({
          ...prev,
          postalCode: "該当する住所が見つかりませんでした",
        }));
      }
    } catch (error) {
      console.error("zipcode search error:", error);
      setFieldErrors((prev) => ({
        ...prev,
        postalCode: "住所検索に失敗しました",
      }));
    }
  };

  const selectSearchMin = (minute) => {
    setPickupForm((prev) => ({ ...prev, searchMin: minute.toString() }));
    if (touchedFields.searchMin) {
      validateField("searchMin", minute.toString());
    }
  };

  const selectUseNum = (number) => {
    setPickupForm((prev) => ({ ...prev, useNum: number.toString() }));
  };

  const requiredInput = useMemo(() => {
    let count = 0;

    if (!pickupForm.userName || pickupForm.userName.trim() === "") count++;
    if (!pickupForm.mail || pickupForm.mail.trim() === "") count++;
    if (!pickupForm.tel || pickupForm.tel.trim() === "") count++;
    if (!pickupForm.postalCode || pickupForm.postalCode.trim() === "") count++;
    if (!pickupForm.addressPrefectureId || !pickupForm.addressPrefectureName)
      count++;
    if (!pickupForm.addressCityName || pickupForm.addressCityName.trim() === "")
      count++;
    if (
      !pickupForm.addressRegionName ||
      pickupForm.addressRegionName.trim() === ""
    )
      count++;
    if (!pickupForm.addressDetail || pickupForm.addressDetail.trim() === "")
      count++;
    if (!pickupForm.searchMin || pickupForm.searchMin.trim() === "") count++;
    if (!pickupForm.carModel || pickupForm.carModel.trim() === "") count++;

    return count;
  }, [pickupForm]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const requiredFields = [
      "userName",
      "mail",
      "tel",
      "postalCode",
      "addressPrefectureId",
      "addressCityName",
      "addressRegionName",
      "addressDetail",
      "searchMin",
      "carModel",
    ];

    const allTouched = requiredFields.reduce(
      (acc, field) => ({ ...acc, [field]: true }),
      {},
    );
    setTouchedFields(allTouched);

    const validationResults = requiredFields.map((field) => {
      if (field === "addressPrefectureId") {
        return validateField(field, pickupForm.addressPrefectureId);
      } else if (field === "addressCityName") {
        return validateField(field, pickupForm.addressCityName);
      } else if (field === "addressRegionName") {
        return validateField(field, pickupForm.addressRegionName);
      } else {
        return validateField(field, pickupForm[field]);
      }
    });

    const allValid = validationResults.every((result) => result === true);

    // todo: submit form data to server
    if (allValid) {
      console.log("placeId:", placeId);
      console.log("form data:", pickupForm);
    }
  };

  const handleScroll = () => {
    if (!formRef.current || !countRef.current || !scrollContainerRef.current)
      return;

    const scrollContainer = scrollContainerRef.current;
    const scrollTop = scrollContainer.scrollTop;

    if (scrollTop > 0) {
      countRef.current.style.top = `${scrollTop + 6}px`;
    } else {
      countRef.current.style.top = "0px";
    }
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            月極駐車場をお問い合わせ（無料）
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div
          ref={scrollContainerRef}
          className="relative p-6 overflow-y-auto"
        >
          <form
            className={`w-full ${isDetailPage ? "mb-4" : ""}`}
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <table
              className={`relative w-full border-collapse border-spacing-0 border-t border-[#d9edde] ${isDetailPage ? "mb-4" : "mb-6"}`}
            >
              <tbody>
                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    お名前
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="flex items-center">
                      <input
                        name="userName"
                        value={pickupForm.userName}
                        onChange={handleChange}
                        onBlur={() => handleBlur("userName")}
                        placeholder="例：駐車 太郎"
                        className={`mr-1.5 h-[33.5px] w-80 rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                          fieldErrors.userName
                            ? "border-red-300 bg-red-200"
                            : checkValidField("userName")
                              ? "bg-teal-50"
                              : "border-[#afc9b0] bg-[#f8f5f0]"
                        }`}
                        maxLength={50}
                      />
                      <p className="text-sm leading-[33px] text-[#3fa743]">
                        例：駐車 太郎
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    会社名
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="flex items-center">
                      <input
                        name="companyName"
                        value={pickupForm.companyName}
                        onChange={handleChange}
                        placeholder="例：株式会社アズーム"
                        className="mr-1.5 h-[33.5px] w-80 rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010]"
                        maxLength={50}
                      />
                      <p className="text-sm leading-[33px] text-[#3fa743]">
                        例：株式会社アズーム
                      </p>
                    </div>
                    <p className="mt-4 text-sm text-[#3fa743]">
                      ※法人の場合のみご入力ください。
                    </p>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    メールアドレス
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="flex items-center">
                      <input
                        name="mail"
                        value={pickupForm.mail}
                        onChange={handleChange}
                        onBlur={() => handleBlur("mail")}
                        placeholder="例：contact_cp@carparking.jp"
                        className={`mr-1.5 h-[33.5px] w-80 rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                          fieldErrors.mail
                            ? "border-red-300 bg-red-200"
                            : checkValidField("mail")
                              ? "bg-teal-50"
                              : "border-[#afc9b0] bg-[#f8f5f0]"
                        }`}
                        maxLength={254}
                        type="email"
                      />
                      <p className="text-sm leading-[33px] text-[#3fa743]">
                        例：contact_cp@carparking.jp
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    電話番号
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <input
                      name="tel"
                      value={pickupForm.tel}
                      onChange={handleChange}
                      onBlur={() => handleBlur("tel")}
                      className={`h-[33.5px] w-80 rounded border px-2 text-sm focus:outline focus:outline-1 focus:outline-[#101010] ${
                        fieldErrors.tel
                          ? "border-red-300 bg-red-200"
                          : checkValidField("tel")
                            ? "bg-teal-50"
                            : "border-[#afc9b0] bg-[#f8f5f0]"
                      }`}
                      maxLength={15}
                      type="tel"
                      aria-label="電話番号"
                    />
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    お探しのエリア
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="flex items-center">
                      <div className="mr-2.5 w-[150px]">
                        <p className="mb-0.5 text-sm">郵便番号</p>
                        <input
                          name="postalCode"
                          value={pickupForm.postalCode}
                          onChange={handleChange}
                          onBlur={() => handleBlur("postalCode")}
                          placeholder="例：1510053"
                          className={`h-[33.5px] w-full rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                            fieldErrors.postalCode
                              ? "border-red-300 bg-red-200"
                              : checkValidField("postalCode")
                                ? "bg-teal-50"
                                : "border-[#afc9b0] bg-[#f8f5f0]"
                          }`}
                          maxLength={50}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={getAddressFromPostalCode}
                        className="mt-[22px] block h-[23px] w-[65px] rounded bg-[#2d82c4] px-0.5 text-center text-xs font-bold text-white shadow-[0_-3px_0_rgba(0,0,0,0.2)_inset] transition-all duration-300 hover:bg-[#00557d]"
                      >
                        住所検索
                      </button>
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="mr-2.5 w-[90px]">
                        <p className="mb-0.5 text-sm">都道府県</p>
                        <input
                          name="addressPrefectureName"
                          value={pickupForm.addressPrefectureName}
                          onChange={handleChange}
                          onBlur={() => handleBlur("addressPrefectureId")}
                          placeholder="例：東京都"
                          className={`h-[33.5px] w-full rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                            fieldErrors.addressPrefectureId
                              ? "border-red-300 bg-red-200"
                              : checkValidField("addressPrefectureId")
                                ? "bg-teal-50"
                                : "border-[#afc9b0] bg-[#f8f5f0]"
                          }`}
                        />
                      </div>
                      <div className="mr-2.5 w-40">
                        <p className="mb-0.5 text-sm">市区</p>
                        <input
                          name="addressCityName"
                          value={pickupForm.addressCityName}
                          onChange={handleChange}
                          onBlur={() => handleBlur("addressCityName")}
                          placeholder="例：渋谷区"
                          className={`h-[33.5px] w-full rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                            fieldErrors.addressCityName
                              ? "border-red-300 bg-red-200"
                              : checkValidField("addressCityName")
                                ? "bg-teal-50"
                                : "border-[#afc9b0] bg-[#f8f5f0]"
                          }`}
                        />
                      </div>
                      <div className="w-40">
                        <p className="mb-0.5 text-sm">町村</p>
                        <input
                          name="addressRegionName"
                          value={pickupForm.addressRegionName}
                          onChange={handleChange}
                          onBlur={() => handleBlur("addressRegionName")}
                          placeholder="例：代々木"
                          className={`h-[33.5px] w-full rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                            fieldErrors.addressRegionName
                              ? "border-red-300 bg-red-200"
                              : checkValidField("addressRegionName")
                                ? "bg-teal-50"
                                : "border-[#afc9b0] bg-[#f8f5f0]"
                          }`}
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="mb-0.5 text-sm">丁目・番地・枝番</p>
                      <input
                        name="addressDetail"
                        value={pickupForm.addressDetail}
                        onChange={handleChange}
                        onBlur={() => handleBlur("addressDetail")}
                        placeholder="例：2丁目1-1"
                        className={`h-[33.5px] w-80 rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                          fieldErrors.addressDetail
                            ? "border-red-300 bg-red-200"
                            : checkValidField("addressDetail")
                              ? "bg-teal-50"
                              : "border-[#afc9b0] bg-[#f8f5f0]"
                        }`}
                        maxLength={50}
                      />
                    </div>
                    <div className="mt-2 table">
                      <div className="inline-flex items-center align-middle">
                        <span className="mb-0.5">徒歩</span>
                        <div className="mx-1.5 h-[33px]">
                          <input
                            name="searchMin"
                            value={pickupForm.searchMin}
                            onChange={handleChange}
                            onBlur={() => handleBlur("searchMin")}
                            className={`h-[33.5px] w-20 rounded border px-2 text-sm focus:outline focus:outline-1 focus:outline-[#101010] ${
                              fieldErrors.searchMin
                                ? "border-red-300 bg-red-200"
                                : checkValidField("searchMin")
                                  ? "bg-teal-50"
                                  : "border-[#afc9b0] bg-[#f8f5f0]"
                            }`}
                            aria-label="徒歩"
                          />
                        </div>
                        <span className="mb-0.5">分以内</span>
                      </div>
                      <div className="ml-2.5 inline-flex items-center align-middle">
                        <ul className="inline-flex">
                          {minuteOptions.map((minute, index) => (
                            <li
                              key={index}
                              className="mx-0.5 cursor-pointer"
                              onClick={() => selectSearchMin(minute)}
                            >
                              <button
                                type="button"
                                className="block h-[23px] w-11 rounded bg-[#2d82c4] px-0.5 text-center text-xs font-bold text-white shadow-[0_-3px_0_rgba(0,0,0,0.2)_inset] transition-all duration-300 hover:bg-[#00557d]"
                              >
                                {minute}分
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-[#3fa743]">
                      ※建物名などは入力しないでください。入力例：東京都渋谷区代々木2-1-1から徒歩10分以内
                      <br />
                      ※徒歩1分は直線距離約80mを目安としてお考えください。
                    </p>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    契約車種
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="flex items-center">
                      <input
                        name="carModel"
                        value={pickupForm.carModel}
                        onChange={handleChange}
                        onBlur={() => handleBlur("carModel")}
                        placeholder="例：プリウス、レクサスLS など"
                        className={`mr-1.5 h-[33.5px] w-80 rounded border px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010] ${
                          fieldErrors.carModel
                            ? "border-red-300 bg-red-200"
                            : checkValidField("carModel")
                              ? "bg-teal-50"
                              : "border-[#afc9b0] bg-[#f8f5f0]"
                        }`}
                        maxLength={50}
                      />
                    </div>
                    <p className="mt-4 text-sm text-[#3fa743]">
                      ※お車の車種をご入力ください。
                      <br />
                      例：プリウス、レクサスLS、ベンツAクラス、BMW3シリーズ、カイエン
                      など
                    </p>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    その他備考
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <textarea
                      name="comment"
                      value={pickupForm.comment}
                      onChange={handleChange}
                      className="h-full w-80 rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 pb-1 pt-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010]"
                      cols={40}
                      maxLength={10000}
                      placeholder="例：急いで探している、賃料重視、距離重視など"
                      rows={4}
                    />
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    お知らせメールの受信
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <label className="flex items-center text-base">
                      <input
                        name="noticeMessageAllowed"
                        type="checkbox"
                        checked={pickupForm.noticeMessageAllowed}
                        onChange={handleChange}
                      />
                      お知らせメールを受信する
                    </label>
                    <p className="mt-0.5 text-[#3fa743]">
                      お探しのエリア近隣のお得な駐車場情報などをお知らせします。チェックをオフにされた場合はお知らせは送信されません。
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              ref={countRef}
              className="absolute right-2.5 top-0 z-[1000] mt-2.5 rounded-lg bg-[#333333bf] px-6 py-4 text-center text-sm leading-relaxed text-white shadow-[0_1px_0_rgba(0,0,0,0.7)] transition-[top] duration-500"
            >
              <dl>
                <dt>入力必須項目</dt>
                <dd>
                  残り
                  <span className="mx-1 text-4xl font-bold text-[#ffffb3]">
                    {requiredInput}
                  </span>
                  項目
                </dd>
              </dl>
            </div>

            <div
              className={`mb-6 flex items-center rounded-lg border border-[#c0e2c7] bg-[#fafcfb] px-4 py-4 ${isDetailPage ? "mb-4" : ""}`}
            >
              <label className="ml-6 flex items-center text-sm">
                <input
                  name="isSaveForm"
                  type="checkbox"
                  checked={isSaveForm}
                  onChange={(e) => setIsSaveForm(e.target.checked)}
                />
                入力されたお客様情報を保存する
              </label>
              <span className="ml-4 mt-0.5 text-xs text-[#3fa743]">
                ※保存された情報は次回お問い合わせから自動で入力されます。
              </span>
            </div>

            <h3 className="mt-16 min-h-[17px] px-5 pt-1 text-base">
              以下をご入力頂くと、スムーズにご案内可能です。
            </h3>
            <p className="mb-4 text-xs">以下の項目は任意入力項目です。</p>

            <table
              className={`mb-6 w-full border-collapse border-spacing-0 border-t border-[#d9edde] ${isDetailPage ? "" : ""}`}
            >
              <tbody className={isDetailPage ? "" : ""}>
                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    お探しの理由
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <select
                      name="searchReason"
                      value={pickupForm.searchReason}
                      onChange={handleChange}
                      aria-label="お探しの理由"
                      className="mr-1.5 h-[33px] min-w-[186px] max-w-[186px] rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 align-middle text-sm text-black"
                    >
                      <option value="">---------</option>
                      {searchReasons.map((reason, index) => (
                        <option key={index} value={reason.value}>
                          {reason.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    契約希望台数
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <div className="table">
                      <div className="inline-flex items-center align-middle">
                        <input
                          name="useNum"
                          value={pickupForm.useNum}
                          onChange={handleChange}
                          className="mr-1.5 h-[33.5px] w-20 rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 text-sm placeholder:text-gray-400 focus:outline focus:outline-1 focus:outline-[#101010]"
                          aria-label="契約希望台数"
                        />
                        <span className="mb-0.5">台</span>
                      </div>
                      <div className="ml-2.5 inline-flex items-center align-middle">
                        <ul className="inline-flex">
                          {useNumbers.map((number) => (
                            <li
                              key={number}
                              className="mx-0.5 cursor-pointer"
                              onClick={() => selectUseNum(number)}
                            >
                              <button
                                type="button"
                                className="block h-[23.5px] w-11 rounded bg-[#2d82c4] px-0.5 text-center text-xs font-bold text-white shadow-[0_-3px_0_rgba(0,0,0,0.2)_inset] transition-all duration-300 hover:bg-[#00557d]"
                              >
                                {number}台
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>

                <tr>
                  <th className="w-40 border-b border-[#d9edde] bg-[#3fa743] px-2.5 py-2.5 align-middle text-left text-xs text-white shadow-[0_1px_0_rgba(0,0,0,0.5)]">
                    契約希望時期
                  </th>
                  <td className="border-b border-[#d9edde] px-2.5 py-2.5 align-middle text-xs">
                    <select
                      name="useTimingYear"
                      value={pickupForm.useTimingYear}
                      onChange={handleChange}
                      className="mr-1.5 h-[33px] min-w-[83px] max-w-[83px] rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 align-middle text-sm text-black"
                      aria-label="契約希望時期（年）"
                    >
                      <option value="">---------</option>
                      {timingYear.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    年
                    <select
                      name="useTimingMonth"
                      value={pickupForm.useTimingMonth}
                      onChange={handleChange}
                      className="ml-1.5 mr-1.5 h-[33px] min-w-[83px] max-w-[83px] rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 align-middle text-sm text-black"
                      aria-label="契約希望時期（月）"
                    >
                      <option value="">---------</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ),
                      )}
                    </select>
                    月
                    <select
                      name="useTimingSeason"
                      value={pickupForm.useTimingSeason}
                      onChange={handleChange}
                      className="ml-1.5 h-[33px] min-w-[83px] max-w-[83px] rounded border border-[#afc9b0] bg-[#f8f5f0] px-2 align-middle text-sm text-black"
                      aria-label="契約希望時期（頃）"
                    >
                      <option value="">---------</option>
                      {timingSeasons.map((timingSeason, index) => (
                        <option key={index} value={timingSeason.value}>
                          {timingSeason.label}
                        </option>
                      ))}
                    </select>
                    頃
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="text-center">
              <button
                className="mx-auto h-[54px] w-[356px] rounded-lg border-[3px] border-[#e3f0e3] bg-[#f1852d] text-sm font-bold tracking-wide text-white shadow-[0_-3px_0_rgba(0,0,0,0.2)_inset] transition-opacity duration-300 hover:opacity-80"
                type="submit"
                data-evt="contact-pickup-入力内容を確認する-2"
              >
                入力内容を確認する
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
