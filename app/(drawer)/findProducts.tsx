import { ThemedText } from "@/components/ThemedText";
import { Image } from "expo-image";
import { ThemedView } from "@/components/ThemedView";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  FlatList,
  Linking,
  Platform,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";

const TEMP_DATA = [
  {
    id: "0",
    name: "COSRX Acne Pimple Master Patch",
    description:
      "Hydrocolloid patches that extract pus and oil from pimples while protecting from bacteria",
    image: require("../../assets/images/products/cosrx-pimple-patch.png"),
    url: "https://www.cosrx.com/products/acne-pimple-master-patch",
  },
  {
    id: "1",
    name: "La Roche-Posay Effaclar Duo+ M",
    description:
      "Triple corrective anti-imperfections care with niacinamide and salicylic acid",
    image: require("../../assets/images/products/laroche-posay-effaclar-duo.webp"),
    url: "https://africa.laroche-posay.com/en-za/effaclar/effaclar-duo-plus-m-anti-imperfections-triple-corrective-care",
  },
  {
    id: "2",
    name: "CeraVe Foaming Facial Cleanser",
    description:
      "Oil-control face wash for normal to oily skin with ceramides and niacinamide",
    image: require("../../assets/images/products/cerave-foaming-cleanser.png"),
    url: "https://www.walmart.com/ip/CeraVe-Foaming-Facial-Cleanser-Oil-Control-Face-Body-Wash-for-Normal-to-Oily-Skin-16-fl-oz/491906666",
  },
  {
    id: "3",
    name: "The INKEY List Salicylic Acid Cleanser",
    description:
      "BHA cleanser that unclogs pores and reduces blackheads with 2% salicylic acid",
    image: require("../../assets/images/products/inkey-list-salicylic-cleanser.webp"),
    url: "https://www.theinkeylist.com/products/supersize-salicylic-acid-cleanser",
  },
  {
    id: "4",
    name: "CeraVe AM Facial Moisturizing Lotion SPF 30",
    description:
      "Morning moisturizer with broad-spectrum sunscreen and ceramides",
    image: require("../../assets/images/products/cerave-am-moisturizer.png"),
    url: "https://www.cerave.com/skincare/moisturizers/am-facial-moisturizing-lotion-with-sunscreen",
  },
  {
    id: "5",
    name: "PanOxyl Acne Creamy Wash",
    description:
      "Benzoyl peroxide face wash that kills acne-causing bacteria and prevents breakouts",
    image: require("../../assets/images/products/panoxyl-creamy-wash.webp"),
    url: "https://panoxyl.com/acne-products/acne-creamy-wash/",
  },
  {
    id: "6",
    name: "Differin Gel (Adapalene 0.1%)",
    description:
      "Prescription-strength retinoid gel for acne treatment and prevention",
    image: require("../../assets/images/products/differin-gel.png"),
    url: "https://differin.com/shop/differin-gel/3029949.html",
  },
  {
    id: "7",
    name: "CeraVe PM Facial Moisturizing Lotion",
    description:
      "Nighttime moisturizer with ceramides, niacinamide, and hyaluronic acid",
    image: require("../../assets/images/products/cerave-pm-moisturizer.png"),
    url: "https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion",
  },
];

type ProductInfoProps = {
  productInfo: {
    id: string;
    name: string;
    description: string;
    image: any;
    url: string;
  };
};

const Product = ({ productInfo }: ProductInfoProps) => {
  const tintColor = useThemeColor({}, "tint");
  const darkerTintColor = useThemeColor({}, "darkerTint");

  return (
    <View style={[styles.productCard, { backgroundColor: darkerTintColor }]}>
      <Image
        source={productInfo.image}
        contentFit="contain"
        style={[styles.image, { backgroundColor: tintColor }]}
      />
      <View style={styles.productInfoContainer}>
        <View>
          <ThemedText type="title" style={styles.title}>
            {productInfo.name}
          </ThemedText>
          <ThemedText style={styles.description}>
            {productInfo.description}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => Linking.openURL(productInfo.url)}
        >
          <ThemedText style={styles.buyButtonText}>Buy Now</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ProductsPage() {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={TEMP_DATA}
        renderItem={({ item }) => <Product productInfo={item} />}
        numColumns={2}
        keyExtractor={(item) => item.id}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    opacity: 0.7,
  },
  buyButton: {
    backgroundColor: Colors.primary_700,
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
