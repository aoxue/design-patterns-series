import { Config } from "@remotion/cli/config";

// jpeg 中间帧：渲染快，画面类内容无透明通道需求
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
