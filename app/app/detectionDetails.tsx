import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, LayoutChangeEvent, Modal, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, ScanFace, AlertCircle, X, Maximize2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questionData } from '@/assets/questions';

type Results = {
    id: string,
    date: string,
    imageUri: string,
    detections: Detection[] | null
    apiStatus?: 'pending' | 'completed' | 'error'
    detectorStatus?: 'completed' | 'unavailable'
    detectorError?: string | null
    classificationSource?: 'tfjs-vit' | 'api' | 'unavailable'
    classificationError?: string | null
    quizAnswers?: Record<string, string>
    imageSize?: {
        width: number,
        height: number
    }
}

type Detection = {
    class: string,
    class_id?: number,
    confidence: number,
    box_xyxy?: [number, number, number, number],
    box_norm?: [number, number, number, number],
}

const TYPE_COLORS: Record<string, string> = {
    comedone: '#3B82F6',
    papule: '#F59E0B',
    pustule: '#EF4444',
    cyst: '#A855F7',
    scar: '#10B981',
};
const DEFAULT_BOX_COLOR = '#EC4899';

type Rect = { l: number; t: number; r: number; b: number };

function renderOverlay(
    detections: Detection[],
    fit: { offsetX: number; offsetY: number; dispW: number; dispH: number },
    containerW: number,
    containerH: number,
) {
    const LABEL_H = 14;
    const CHAR_W = 5.2;
    const PAD_X = 4;
    const GAP = 2;

    const items = detections
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => !!d.box_norm)
        .sort((a, b) => b.d.confidence - a.d.confidence);

    const overlap = (a: Rect, b: Rect) =>
        a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));
    const imgL = fit.offsetX;
    const imgT = fit.offsetY;
    const imgR = fit.offsetX + fit.dispW;
    const imgB = fit.offsetY + fit.dispH;
    const boxRects: Rect[] = items.map(({ d }) => {
        const [x1, y1, x2, y2] = d.box_norm!;
        const cx1 = clamp(x1, 0, 1), cy1 = clamp(y1, 0, 1);
        const cx2 = clamp(x2, 0, 1), cy2 = clamp(y2, 0, 1);
        const left = clamp(fit.offsetX + cx1 * fit.dispW, imgL, imgR);
        const top = clamp(fit.offsetY + cy1 * fit.dispH, imgT, imgB);
        const right = clamp(fit.offsetX + cx2 * fit.dispW, imgL, imgR);
        const bottom = clamp(fit.offsetY + cy2 * fit.dispH, imgT, imgB);
        return { l: left, t: top, r: right, b: bottom };
    });
    const placedLabels: Rect[] = [];
    const nodes: any[] = [];

    items.forEach(({ d, i }, idx) => {
        const box = boxRects[idx];
        const w = box.r - box.l;
        const h = box.b - box.t;
        if (w <= 1 || h <= 1) return;
        const color = TYPE_COLORS[d.class] || DEFAULT_BOX_COLOR;

        const fullText = `${d.class} ${(d.confidence * 100).toFixed(0)}%`;
        const shortText = `${d.class[0].toUpperCase()} ${(d.confidence * 100).toFixed(0)}%`;
        const fullW = fullText.length * CHAR_W + PAD_X * 2;
        const shortW = shortText.length * CHAR_W + PAD_X * 2;
        const useShort = w < fullW;
        const text = useShort ? shortText : fullText;
        const labelW = useShort ? shortW : fullW;

        const yCandidates = [box.t - LABEL_H - GAP, box.b + GAP];
        const otherBoxes = boxRects.filter((_, k) => k !== idx);
        const obstacles = [...otherBoxes, ...placedLabels];

        let picked: Rect | null = null;
        for (const y of yCandidates) {
            if (y < 0 || y + LABEL_H > containerH) continue;
            const baseX = Math.max(0, Math.min(box.l, containerW - labelW));
            const xTries = [baseX, box.l + w / 2 - labelW / 2, box.r - labelW, box.l, 0, containerW - labelW];
            for (const xCand of xTries) {
                const xx = Math.max(0, Math.min(xCand, containerW - labelW));
                const r: Rect = { l: xx, t: y, r: xx + labelW, b: y + LABEL_H };
                if (obstacles.every((o) => !overlap(r, o))) {
                    picked = r;
                    break;
                }
            }
            if (picked) break;
        }
        if (!picked) {
            // last resort: scan vertical strip for free Y
            const baseX = Math.max(0, Math.min(box.l, containerW - labelW));
            for (let y = 0; y + LABEL_H <= containerH; y += LABEL_H + 1) {
                const r: Rect = { l: baseX, t: y, r: baseX + labelW, b: y + LABEL_H };
                if (obstacles.every((o) => !overlap(r, o))) {
                    picked = r;
                    break;
                }
            }
        }
        if (!picked) {
            const x = Math.max(0, Math.min(box.l, containerW - labelW));
            const y = Math.max(0, box.t - LABEL_H - GAP);
            picked = { l: x, t: y, r: x + labelW, b: y + LABEL_H };
        }
        placedLabels.push(picked);

        nodes.push(
            <View
                key={`b-${i}`}
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    left: box.l, top: box.t, width: w, height: h,
                    borderWidth: 2,
                    borderColor: color,
                    borderRadius: 3,
                }}
            />
        );
        nodes.push(
            <View
                key={`l-${i}`}
                pointerEvents="none"
                style={{
                    position: 'absolute',
                    left: picked.l,
                    top: picked.t,
                    height: LABEL_H,
                    backgroundColor: color,
                    paddingHorizontal: PAD_X,
                    borderRadius: 2,
                    justifyContent: 'center',
                }}
            >
                <ThemedText style={{ color: '#fff', fontSize: 9, fontWeight: '700', lineHeight: 11 }}>
                    {text}
                </ThemedText>
            </View>
        );
    });

    return nodes;
}

export default function DetectionDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [result, setResult] = useState<Results | null>(null);
    const [imgLayout, setImgLayout] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
    const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
    const [zoomOpen, setZoomOpen] = useState(false);

    const onImgLayout = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setImgLayout({ w: width, h: height });
    };

    const computeFitRect = () => {
        if (!naturalSize || imgLayout.w === 0) return null;
        const { w: iw, h: ih } = naturalSize;
        const cw = imgLayout.w, ch = imgLayout.h;
        const scale = Math.min(cw / iw, ch / ih);
        const dispW = iw * scale, dispH = ih * scale;
        const offsetX = (cw - dispW) / 2;
        const offsetY = (ch - dispH) / 2;
        return { offsetX, offsetY, dispW, dispH };
    };

    useEffect(() => {
        async function loadDetection() {
            if (!id) return;

            const rawDetection = await AsyncStorage.getItem(id);
            if (rawDetection) {
                const detection: Results = JSON.parse(rawDetection);
                setResult(detection);
                if (detection.imageUri) {
                    Image.getSize(
                        detection.imageUri,
                        (w, h) => setNaturalSize({ w, h }),
                        () => setNaturalSize(null),
                    );
                }
            }
        }

        loadDetection();
    }, [id]);

    if (!result) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </ThemedView>
        );
    }

    if (!result.detections) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                        <ThemedText style={styles.backText}>Back</ThemedText>
                    </TouchableOpacity>
                    <View style={styles.errorState}>
                        <AlertCircle size={40} color={Colors.error} />
                        <ThemedText style={styles.errorStateText}>
                            {result.apiStatus === 'error' ? 'Analysis failed. Please try again.' : 'Processing detections...'}
                        </ThemedText>
                    </View>
                </SafeAreaView>
            </ThemedView>
        );
    }

    // Group detections by acne type
    const detectionsByType = result.detections.reduce((acc, detection) => {
        const acneType = detection.class;
        if (!acc[acneType]) {
            acc[acneType] = [];
        }
        acc[acneType].push(detection);
        return acc;
    }, {} as Record<string, Detection[]>);
    const detectorUnavailable = result.detectorStatus === 'unavailable';

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                        <ThemedText style={styles.backText}>Back</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.title}>Scan Details</ThemedText>
                    <ThemedText style={styles.date}>
                        {new Date(result.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </ThemedText>

                    {result.imageUri && (
                        <TouchableOpacity activeOpacity={0.95} onPress={() => setZoomOpen(true)} style={styles.imageContainer} onLayout={onImgLayout}>
                            <Image
                                source={{ uri: result.imageUri }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                            <View style={styles.zoomHint} pointerEvents="none">
                                <Maximize2 size={14} color="#fff" />
                            </View>
                            {(() => {
                                const fit = computeFitRect();
                                if (!fit || !result.detections) return null;
                                return renderOverlay(result.detections, fit, imgLayout.w, imgLayout.h);
                            })()}
                        </TouchableOpacity>
                    )}

                    {/* Summary pill */}
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryPill, detectorUnavailable && styles.summaryPillWarning]}>
                            {detectorUnavailable ? (
                                <AlertCircle size={18} color={Colors.error} />
                            ) : (
                                <ScanFace size={18} color={Colors.primary_800} />
                            )}
                            <ThemedText style={styles.summaryText}>
                                {detectorUnavailable
                                    ? 'Spot detector unavailable'
                                    : `${result.detections.length} spot${result.detections.length !== 1 ? 's' : ''} detected`}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Breakdown by type */}
                    {!detectorUnavailable && (
                        <>
                            <ThemedText style={styles.sectionHeading}>Breakdown by Type</ThemedText>
                            {Object.entries(detectionsByType).length > 0 ? (
                                Object.entries(detectionsByType).map(([type, detections]) => (
                                    <View key={type} style={styles.typeCard}>
                                        <View style={styles.typeCardHeader}>
                                            <ThemedText style={styles.typeName}>{type}</ThemedText>
                                            <View style={styles.countBadge}>
                                                <ThemedText style={styles.countText}>{detections.length}</ThemedText>
                                            </View>
                                        </View>
                                        <ThemedText style={styles.confidenceText}>
                                            Avg. confidence: {(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length * 100).toFixed(1)}%
                                        </ThemedText>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.typeCard}>
                                    <ThemedText style={styles.typeName}>No acne spots detected</ThemedText>
                                    <ThemedText style={styles.confidenceText}>The detector completed but did not return any spot boxes.</ThemedText>
                                </View>
                            )}
                        </>
                    )}

                    {/* Recommendations */}
                    {result.quizAnswers && (
                        <>
                            <ThemedText style={[styles.sectionHeading, { marginTop: 8 }]}>Recommendations</ThemedText>
                            {Object.entries(result.quizAnswers).map(([questionId, answer]) => {
                                const question = questionData.find(q => q.id === parseInt(questionId));
                                const recommendation = question?.options[answer];

                                if (!recommendation || !question) return null;

                                return (
                                    <View key={questionId} style={styles.recCard}>
                                        <ThemedText style={styles.recCategory}>{question.category}</ThemedText>
                                        <ThemedText style={styles.recText}>{recommendation}</ThemedText>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
            <ZoomModal
                visible={zoomOpen}
                onClose={() => setZoomOpen(false)}
                imageUri={result.imageUri}
                detections={result.detections}
                naturalSize={naturalSize}
            />
        </ThemedView>
    );
}

function ZoomModal({
    visible,
    onClose,
    imageUri,
    detections,
    naturalSize,
}: {
    visible: boolean;
    onClose: () => void;
    imageUri: string;
    detections: Detection[] | null;
    naturalSize: { w: number; h: number } | null;
}) {
    const [layout, setLayout] = useState({ w: 0, h: 0 });
    const win = Dimensions.get('window');

    const fit = (() => {
        if (!naturalSize || layout.w === 0) return null;
        const cw = layout.w, ch = layout.h;
        const scale = Math.min(cw / naturalSize.w, ch / naturalSize.h);
        const dispW = naturalSize.w * scale, dispH = naturalSize.h * scale;
        return {
            offsetX: (cw - dispW) / 2,
            offsetY: (ch - dispH) / 2,
            dispW,
            dispH,
        };
    })();

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.zoomBackdrop}>
                <ScrollView
                    style={{ flex: 1, width: win.width }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    maximumZoomScale={5}
                    minimumZoomScale={1}
                    pinchGestureEnabled
                    bouncesZoom
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    centerContent
                >
                    <View
                        style={{ width: win.width, height: win.height, overflow: 'hidden' }}
                        onLayout={(e) => setLayout({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
                    >
                        <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                        {fit && detections && renderOverlay(detections, fit, layout.w, layout.h)}
                    </View>
                </ScrollView>
                <TouchableOpacity onPress={onClose} style={styles.zoomClose} activeOpacity={0.8}>
                    <X size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary_900,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        opacity: 0.5,
        marginBottom: 20,
    },
    imageContainer: {
        width: '100%',
        height: 280,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: Colors.primary_100,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    zoomHint: {
        position: 'absolute',
        right: 10,
        top: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    zoomBackdrop: {
        flex: 1,
        backgroundColor: '#000',
    },
    zoomClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryRow: {
        marginBottom: 24,
    },
    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary_100,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    summaryPillWarning: {
        backgroundColor: '#FEE2E2',
    },
    summaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary_900,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    typeCard: {
        backgroundColor: Colors.primary_100,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        gap: 6,
    },
    typeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeName: {
        fontSize: 15,
        fontWeight: '600',
    },
    countBadge: {
        backgroundColor: Colors.primary_800,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    confidenceText: {
        fontSize: 13,
        opacity: 0.55,
    },
    recCard: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary_600,
        paddingLeft: 14,
        paddingVertical: 8,
        marginBottom: 12,
    },
    recCategory: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.55,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    recText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    errorState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    errorStateText: {
        opacity: 0.6,
        textAlign: 'center',
    },
});
