import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import { ThemedView } from "@/components/ThemedView";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  FlatList,
  Linking,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

type Severity = "clear" | "mild" | "moderate" | "severe";

type Product = {
  id: string;
  name: string;
  description: string;
  image: any;
  url: string;
  severities: Severity[]; // which skin states this product targets
  weight: number; // higher = more strongly recommended within matching severity
};

const PRODUCTS: Product[] = [
  {
    id: "0",
    name: "COSRX Acne Pimple Master Patch",
    description:
      "Hydrocolloid patches that extract pus and oil from pimples while protecting from bacteria",
    image: require("../../assets/images/products/cosrx-pimple-patch.png"),
    url: "https://www.cosrx.com/products/acne-pimple-master-patch",
    severities: ["mild", "moderate"],
    weight: 0.8,
  },
  {
    id: "1",
    name: "La Roche-Posay Effaclar Duo+ M",
    description:
      "Triple corrective anti-imperfections care with niacinamide and salicylic acid",
    image: require("../../assets/images/products/laroche-posay-effaclar-duo.webp"),
    url: "https://africa.laroche-posay.com/en-za/effaclar/effaclar-duo-plus-m-anti-imperfections-triple-corrective-care",
    severities: ["mild", "moderate", "severe"],
    weight: 0.9,
  },
  {
    id: "2",
    name: "CeraVe Foaming Facial Cleanser",
    description:
      "Oil-control face wash for normal to oily skin with ceramides and niacinamide",
    image: require("../../assets/images/products/cerave-foaming-cleanser.png"),
    url: "https://www.walmart.com/ip/CeraVe-Foaming-Facial-Cleanser-Oil-Control-Face-Body-Wash-for-Normal-to-Oily-Skin-16-fl-oz/491906666",
    severities: ["clear", "mild", "moderate", "severe"],
    weight: 0.7,
  },
  {
    id: "3",
    name: "The INKEY List Salicylic Acid Cleanser",
    description:
      "BHA cleanser that unclogs pores and reduces blackheads with 2% salicylic acid",
    image: require("../../assets/images/products/inkey-list-salicylic-cleanser.webp"),
    url: "https://www.theinkeylist.com/products/supersize-salicylic-acid-cleanser",
    severities: ["mild", "moderate"],
    weight: 0.85,
  },
  {
    id: "4",
    name: "CeraVe AM Facial Moisturizing Lotion SPF 30",
    description:
      "Morning moisturizer with broad-spectrum sunscreen and ceramides",
    image: require("../../assets/images/products/cerave-am-moisturizer.png"),
    url: "https://www.cerave.com/skincare/moisturizers/am-facial-moisturizing-lotion-with-sunscreen",
    severities: ["clear", "mild", "moderate", "severe"],
    weight: 0.75,
  },
  {
    id: "5",
    name: "PanOxyl Acne Creamy Wash",
    description:
      "Benzoyl peroxide face wash that kills acne-causing bacteria and prevents breakouts",
    image: require("../../assets/images/products/panoxyl-creamy-wash.webp"),
    url: "https://panoxyl.com/acne-products/acne-creamy-wash/",
    severities: ["moderate", "severe"],
    weight: 0.95,
  },
  {
    id: "6",
    name: "Differin Gel (Adapalene 0.1%)",
    description:
      "Prescription-strength retinoid gel for acne treatment and prevention",
    image: require("../../assets/images/products/differin-gel.png"),
    url: "https://differin.com/shop/differin-gel/3029949.html",
    severities: ["moderate", "severe"],
    weight: 1.0,
  },
  {
    id: "7",
    name: "CeraVe PM Facial Moisturizing Lotion",
    description:
      "Nighttime moisturizer with ceramides, niacinamide, and hyaluronic acid",
    image: require("../../assets/images/products/cerave-pm-moisturizer.png"),
    url: "https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion",
    severities: ["clear", "mild", "moderate", "severe"],
    weight: 0.7,
  },
];

const SEVERITY_LABEL: Record<Severity, string> = {
  clear: "Clear skin",
  mild: "Mild acne",
  moderate: "Moderate acne",
  severe: "Severe acne",
};

const SEVERITY_COLOR: Record<Severity, string> = {
  clear: "#10B981",
  mild: "#F59E0B",
  moderate: "#F97316",
  severe: "#EF4444",
};

async function getLatestSeverity(): Promise<Severity | null> {
  try {
    const rawIds = await AsyncStorage.getItem("detections");
    if (!rawIds) return null;
    const ids: string[] = JSON.parse(rawIds);
    for (let i = ids.length - 1; i >= 0; i--) {
      const raw = await AsyncStorage.getItem(ids[i]);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      const pred = obj?.prediction;
      if (pred && ["clear", "mild", "moderate", "severe"].includes(pred)) {
        return pred as Severity;
      }
    }
  } catch {}
  return null;
}

function rankProducts(severity: Severity | null): Product[] {
  if (!severity) {
    return [...PRODUCTS].sort((a, b) => b.weight - a.weight);
  }
  return [...PRODUCTS]
    .filter((p) => p.severities.includes(severity))
    .sort((a, b) => b.weight - a.weight);
}

const ProductCard = ({ productInfo }: { productInfo: Product }) => {
  const cardBackground = useThemeColor({}, "cardBackground");
  const imageBackground = useThemeColor({}, "imageBackground");

  return (
    <View style={[styles.productCard, { backgroundColor: cardBackground }]}>
      <Image
        source={productInfo.image}
        contentFit="contain"
        style={[styles.image, { backgroundColor: imageBackground }]}
      />
      <View style={styles.productInfoContainer}>
        <View>
          <ThemedText type="title" style={styles.title}>
            {productInfo.name}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.description}>
            {productInfo.description}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => Linking.openURL(productInfo.url)}
        >
          <ThemedText style={styles.buyButtonText} lightColor="#fff" darkColor="#fff">Buy Now</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ProductsPage() {
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [items, setItems] = useState<Product[]>(PRODUCTS);

  const refresh = useCallback(async () => {
    const sev = await getLatestSeverity();
    setSeverity(sev);
    setItems(rankProducts(sev));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.header}>
        {severity ? (
          <View style={styles.headerInner}>
            <ThemedText style={styles.headerTitle}>Recommended for</ThemedText>
            <View style={[styles.badge, { backgroundColor: SEVERITY_COLOR[severity] }]}>
              <ThemedText style={styles.badgeText} lightColor="#fff" darkColor="#fff">
                {SEVERITY_LABEL[severity]}
              </ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.headerInner}>
            <ThemedText style={styles.headerTitle}>Recommended Products</ThemedText>
            <ThemedText style={styles.headerSub}>
              Top-rated picks for clear skin. Scan for personalized matches.
            </ThemedText>
          </View>
        )}
      </View>
      <FlatList
        data={items}
        renderItem={({ item }) => <ProductCard productInfo={item} />}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSub: {
    width: "100%",
    fontSize: 13,
    opacity: 0.55,
    marginTop: 4,
    textAlign: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  productCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: {
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
  buyButton: {
    backgroundColor: Colors.primary_900,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
