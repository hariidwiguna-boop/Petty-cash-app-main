import { useWindowDimensions, Platform, PixelRatio } from 'react-native';

/**
 * Responsive Hook for Petty Cash App
 * Helps scaling UI for different screen sizes (Phones & Tablets)
 */
export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const isTablet = width >= 600;
    const isSmallPhone = width < 380;

    // Guideline sizes are based on standard phone screen (approx iPhone 11)
    const guidelineBaseWidth = 375;
    const guidelineBaseHeight = 812;

    const horizontalScale = (size: number) => (width / guidelineBaseWidth) * size;
    const verticalScale = (size: number) => (height / guidelineBaseHeight) * size;
    const moderateScale = (size: number, factor = 0.5) => size + (horizontalScale(size) - size) * factor;

    // Responsive Font Scaling
    const fontScale = (size: number) => {
        const scale = width / guidelineBaseWidth;
        const newSize = size * scale;
        if (Platform.OS === 'ios') {
            return Math.round(PixelRatio.getPixelSizeForLayoutSize(newSize)) / PixelRatio.get();
        } else {
            return Math.round(PixelRatio.getPixelSizeForLayoutSize(newSize)) / PixelRatio.get();
        }
    };

    /**
     * Scale property dynamically based on device type
     */
    function getResponsiveValue<T>(phoneValue: T, tabletValue: T): T {
        return isTablet ? tabletValue : phoneValue;
    }

    return {
        width,
        height,
        isTablet,
        isSmallPhone,
        horizontalScale,
        verticalScale,
        moderateScale,
        fontScale,
        getResponsiveValue,
        // Common layout constants
        containerPadding: moderateScale(20),
        cardRadius: moderateScale(16),
        modalWidth: getResponsiveValue<string | number>('90%', 500),
    };
};
