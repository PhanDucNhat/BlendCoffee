export type Ward = {
  Id: string;
  Name: string;
  Level: string;
};

export type District = {
  Id: string;
  Name: string;
  Wards: Ward[];
};

export type Province = {
  Id: string;
  Name: string;
  Districts: District[];
};

const URL =
  "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json";

let cachedProvinces: Province[] | null = null;

export const getProvinces = async (): Promise<Province[]> => {
  if (cachedProvinces) return cachedProvinces;

  try {
    const res = await fetch(URL, { cache: "force-cache" });
    if (!res.ok) throw new Error("Network error");

    const data = (await res.json()) as Province[];
    cachedProvinces = data;
    return data;
  } catch (error) {
    console.warn("Load tỉnh thành online thất bại, dùng backup...", error);
    try {
      const backup = await import("./vietnam-local.json");
      cachedProvinces = backup.default as Province[];
      return cachedProvinces;
    } catch {
      return [];
    }
  }
};