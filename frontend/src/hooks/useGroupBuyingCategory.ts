import { useEffect, useState, useMemo } from "react";
import React from "react";
import api from "@/apis/apiClient";
import {
  BsLaptop,
  BsHouseHeart,
  BsController,
  BsBook,
  BsBoxSeam,
  BsJournalBookmark,
  BsGrid3X3,
} from "react-icons/bs";
import { IoFastFoodOutline, IoManSharp, IoWomanSharp } from "react-icons/io5";
import { FaBaby, FaSeedling } from "react-icons/fa";
import { MdSportsBaseball, MdPets, MdOutlineFace } from "react-icons/md";
import { GiLargeDress } from "react-icons/gi";

const CATEGORY_ICONS: Record<string, React.ComponentType> = {
  DIGITAL_DEVICE: BsLaptop,
  HOME_APPLIANCE: BsHouseHeart,
  FURNITURE_INTERIOR: BsGrid3X3,
  CHILDREN: FaBaby,
  FOOD: IoFastFoodOutline,
  CHILDREN_BOOK: BsBook,
  SPORTS_LEISURE: MdSportsBaseball,
  WOMEN_ACCESSORIES: IoWomanSharp,
  WOMEN_CLOTHING: GiLargeDress,
  MEN_FASHION: IoManSharp,
  GAME_HOBBY: BsController,
  BEAUTY: MdOutlineFace,
  PET_SUPPLIES: MdPets,
  BOOK_TICKET_MUSIC: BsJournalBookmark,
  PLANT: FaSeedling,
  ETC: BsBoxSeam,
};
const DEFAULT_ICON = BsBoxSeam;

export function useGroupBuyingCategory() {
  const [isLoading, setIsLoading] = useState(true);
  const [categoryList, setCategoryList] = useState<
    { key: string; label: string }[]
  >([]);

  useEffect(() => {
    api
      .get("/api/group-buying/enums")
      .then((res) => {
        setCategoryList(res.data.category);
        setIsLoading(false);
      })
      .catch((err) => {
        setIsLoading(false);
      });
  }, []);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    // API 응답이 없을 때 categoryList가 undefined가 되는 경우를 방지
    (categoryList || []).forEach((s) => (map[s.key] = s.label));
    return map;
  }, [categoryList]);

  const categoryIconMap = useMemo(() => {
    const map: Record<string, React.ComponentType> = {};
    (categoryList || []).forEach((s) => {
      map[s.key] = CATEGORY_ICONS[s.key] || DEFAULT_ICON;
    });
    return map;
  }, [categoryList]);

  return {
    isLoading,
    categoryMap,
    categoryIconMap,
    categoryList,
  };
}
