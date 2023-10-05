import { NativeEventEmitter, NativeModules, Platform } from "react-native";
import { VisionCameraProxy, type Frame } from "react-native-vision-camera";
import type {
  AndroidBarcode,
  Barcode,
  CodeType,
  FrameProcessorPlugin,
  VisionCameraConstants,
  iOSBarcode,
} from "./types";
import { normalizeNativeBarcode } from "./utils";

const LINKING_ERROR =
  `The package 'vision-camera-code-scanner' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: "" }) +
  "- You rebuilt the app after installing the package\n" +
  "- You are not using Expo Go\n";

export const VisionCameraCodeScanner = NativeModules.VisionCameraCodeScanner
  ? NativeModules.VisionCameraCodeScanner
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

export const { MODULE_NAME, BARCODE_TYPES, BARCODE_FORMATS } =
  VisionCameraCodeScanner.getConstants() as VisionCameraConstants;

export const visionCameraEventEmitter = new NativeEventEmitter(
  VisionCameraCodeScanner,
);

const visionCameraProcessorPlugin = VisionCameraProxy.getFrameProcessorPlugin(
  MODULE_NAME,
) as FrameProcessorPlugin | null;

export const scanCodes = (frame: Frame, codeTypes?: CodeType[]): Barcode[] => {
  "worklet";
  if (visionCameraProcessorPlugin == null) {
    throw new Error(`Failed to load Frame Processor Plugin "${MODULE_NAME}"!`);
  }
  const nativeCodes = visionCameraProcessorPlugin.call(frame, {
    codeTypes,
  }) as unknown as (AndroidBarcode | iOSBarcode)[];
  return nativeCodes.map((nativeBarcode) =>
    normalizeNativeBarcode(nativeBarcode, frame),
  );
};
