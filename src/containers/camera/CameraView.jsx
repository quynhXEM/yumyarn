import {isFulfilled} from '@reduxjs/toolkit';
import { t } from 'i18next';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  LayoutAnimation,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Reanimated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated';
import {Image, View} from 'react-native-ui-lib';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';

Reanimated.addWhitelistedNativeProps({zoom: true});
const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera);

const CameraView = props => {
  const {updateListMedia, closeModal} = props;

  const camera_ref = useRef(null);
  const [check_flash, setcheck_flash] = useState(false);
  const [switch_tick, setswitch_tick] = useState(true);
  const [front_camera, setfront_camera] = useState(false);
  const [video_status, setvideo_status] = useState(false);
  const [recording_time, setrecording_time] = useState(0);

  const device = useCameraDevice(front_camera ? 'front' : 'back');
  const format = useCameraFormat(device, [{type: 'photo'}, {type: 'video'}]);
  const [intervalId, setintervalId] = useState(null);
  const [itemiamge, set_itemiamge] = useState(null);
  const [is_capturing, setis_capturing] = useState(false);
  const [showFash, setShowFash] = useState(false);
  const [showOclock, setShowOclock] = useState(false)

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  const zoom = useSharedValue(device?.neutralZoom);
  const exposure = useSharedValue(device?.neutralExposure);
  const zoomOffset = useSharedValue(0);

  const [listCamera, setlistCamera] = useState([
    {id: 1, name: 'Video', status: false},
    {id: 2, name: 'Máy ảnh', status: true},
  ]);
  const handleShowSelectionOclock = () => {
    setShowOclock(!showOclock);
    LayoutAnimation.easeInEaseOut();
  };
  const handleSectionOclock = status => {
    //xử lí chọn selection ở đây
    setShowFash(false);
    LayoutAnimation.easeInEaseOut();
  };

  const handleShowSelectionFlash = () => {
    setShowFash(!showFash);
    LayoutAnimation.easeInEaseOut();
  };
  const handleSelectionFlash = status => {
    setcheck_flash(status);
    setShowFash(false);
    LayoutAnimation.easeInEaseOut();
  };

  const tick_item_camera = id => {
    const updatestatus = listCamera.map(item => ({
      ...item,
      status: item.id === id,
    }));
    setvideo_status(id === 1);
    setlistCamera(updatestatus);
  };

  const gesture = Gesture.Pinch()
    .onBegin(() => {
      zoomOffset.value = zoom.value;
    })
    .onUpdate(event => {
      const z = zoomOffset.value * event.scale;
      zoom.value = interpolate(
        z,
        [1, 10],
        [device.minZoom, device.maxZoom],
        Extrapolation.CLAMP,
      );
    });

  const focus = useCallback(point => {
    try {
      const c = camera_ref.current;
      if (c == null) return;

      c.focus(point);
    } catch (error) {
      console.log('Error focusing:', error);
    }
  }, []);

  const tapGesture = Gesture.Tap().onEnd(event => {
    const {x, y} = event;
    runOnJS(focus)({x, y});
  });

  const animated_props = useAnimatedProps(
    () => ({
      zoom: zoom.value,
      exposure: exposure.value,
    }),
    [zoom, exposure],
  );

  const handleCapture = async () => {
    if (video_status) {
      await videoCapture();
    } else {
      await camera_capture();
    }

    if (!video_status || !is_capturing) {
      setswitch_tick(!switch_tick);
    }
  };

  const startRecordingTimer = () => {
    setrecording_time(0);
    const id = setInterval(() => {
      setrecording_time(prevTime => prevTime + 1);
    }, 1000);
    setintervalId(id);
  };

  const stopRecordingTimer = () => {
    clearInterval(intervalId);
    setintervalId(null);
  };

  useEffect(() => {
    if (recording_time >= 30) {
      camera_ref.current?.stopRecording();
      setis_capturing(false);
      stopRecordingTimer();
    }
  }, [recording_time]);

  const videoCapture = async () => {
    if (!is_capturing) {
      try {
        await camera_ref.current.startRecording({
          onRecordingError: error => console.log(error),
          onRecordingFinished: video => {
            set_itemiamge(video);
          },
          flash: check_flash && !front_camera ? 'on' : 'off',
          fileType: 'mp4',
        });

        setis_capturing(true);
        startRecordingTimer();
      } catch (error) {
        console.log('Error starting video recording:', error);
      }
    } else {
      try {
        await camera_ref.current?.stopRecording();
        setis_capturing(false);
        stopRecordingTimer();
      } catch (error) {
        console.log('Error stopping video recording:', error);
      }
    }
  };

  const camera_capture = async () => {
    if (!is_capturing) {
      setis_capturing(true);

      try {
        const photo = await camera_ref.current?.takePhoto({
          flash: check_flash && !front_camera ? 'on' : 'off',
          enableAutoDistortionCorrection: true,
          enableAutoRedEyeReduction: true,
          enableShutterSound: true,
        });
        
        set_itemiamge(photo);
      } catch (error) {
        console.log('Lỗi khi chụp ảnh:', error);
      } finally {
        setswitch_tick(!switch_tick);
        setis_capturing(false);
      }
    }
  };

  return (
    <GestureHandlerRootView>
      <View flex>
        <GestureDetector gesture={Gesture.Exclusive(gesture, tapGesture)}>
          <View style={{flex: 1}}>
            <ReanimatedCamera
              style={styles.camera}
              device={device}
              format={format}
              isActive={true}
              photo={!video_status}
              audio={true}
              video={video_status}
              ref={camera_ref}
              animatedProps={animated_props}
              photoQualityBalance={'speed'}
            />

            {is_capturing && video_status && (
              <Text style={styles.recordingTimeText}>{recording_time}</Text>
            )}
          </View>
        </GestureDetector>

        <View style={styles.headerCamera}>
          <Pressable
            onPress={() => {
              setis_capturing(false);
              stopRecordingTimer();
              closeModal();
            }}>
            <Image assetName="arrow_back" width={20} height={20} />
          </Pressable>
          <View>
            <Pressable style={{alignSelf:'center'}} onPress={handleShowSelectionOclock}>
              <Image assetName="clock" width={28} height={28} />
            </Pressable>
            {showOclock && (
              <View>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSectionOclock(true)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    2 {t('second')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSectionOclock(false)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    5 {t('second')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSectionOclock(false)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    10 {t('second')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSectionOclock(false)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    15 {t('second')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={styles.opacity_flash}
              onPress={handleShowSelectionFlash}>
              {check_flash ? (
                <Image assetName="flash" width={28} height={28} />
              ) : (
                <Image assetName="un_flash" width={28} height={28} />
              )}
            </TouchableOpacity>
            {showFash && (
              <View>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSelectionFlash(true)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    {t('on')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.opacity_text_flash}
                  onPress={() => handleSelectionFlash(false)}>
                  <Text
                    style={{color: 'white', fontSize: 14, fontWeight: '500'}}>
                    {t('off')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View
          style={{
            position: 'absolute',
            width: '100%',
            bottom: 0,
            paddingBottom: 20,
          }}>
          <View style={styles.viewItem}>
            {listCamera.map(item => (
              <View key={item.id}>
                <View
                  style={{
                    padding: 5,
                    marginHorizontal: 5,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#FE5200',
                    backgroundColor: '#ababab',
                  }}>
                  <Pressable
                    onPress={() => {
                      !is_capturing && tick_item_camera(item.id);
                      LayoutAnimation.easeInEaseOut();
                    }}>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 15,
                        fontWeight: 'bold',
                      }}>
                      {item.name}
                    </Text>
                  </Pressable>
                </View>
                {item.status && (
                  <Pressable style={styles.indicatorItem}></Pressable>
                )}
              </View>
            ))}
          </View>
          <View style={styles.viewfeature}>
            {!is_capturing && !switch_tick ? (
              <Pressable
                style={{
                  width: 70,
                  height: 70,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  setswitch_tick(!switch_tick);
                  set_itemiamge(null);
                }}>
                <Text>Cancle</Text>
              </Pressable>
            ) : (
              <View style={{width: 70, height: 70}}></View>
            )}

            {switch_tick && !video_status ? (
              <Pressable
                style={styles.tickCamera}
                onPress={handleCapture}
                disabled={is_capturing}></Pressable>
            ) : switch_tick && video_status ? (
              <Pressable
                style={styles.outlinebuttonvideo}
                onPress={handleCapture}
                disabled={is_capturing}>
                <View style={styles.clickvideo}></View>
              </Pressable>
            ) : is_capturing && video_status ? (
              <Pressable
                style={styles.outlinebuttonvideo}
                onPress={handleCapture}>
                <View style={styles.stopvideo}></View>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.tickCamera,{justifyContent:"center",alignItems:'center' }]}
                onPress={() => {
                  if (!is_capturing) {
                    setswitch_tick(!switch_tick);
                    closeModal();
                    updateListMedia(itemiamge);
                  }
                }}>
                <Image assetName="tickCamera" width={40} height={40} />
              </Pressable>
            )}
            {!switch_tick && !video_status ? (
              <Pressable style={styles.cutCamera}>
                <Image assetName="crop" width={30} height={30} />
              </Pressable>
            ) : (
              <Pressable
                style={styles.switchCamera}
                onPress={() => {
                  if (video_status) setfront_camera(!front_camera);
                  else if (!is_capturing) {
                    setfront_camera(!front_camera);
                  }
                }}>
                <Image assetName="switch_camera" width={30} height={30} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  opacity_text_flash: {
    alignItems: 'center',
    marginTop: 15,
  },
  opacity_flash: {
    marginTop: 20,
    alignSelf:'center'
  },
  recordingTimeText: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    color: 'white',
    fontSize: 18,
  },
  outlinebuttonvideo: {
    width: 72,
    height: 72,
    padding: 5,
    borderRadius: 90,
    borderColor: '#FE5200',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  captureButtonContainer: {
    flex: 2,
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  headerCamera: {
    width: '100%',
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: '6%',
  },
  viewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginVertical: 20,
  },
  indicatorItem: {
    height: 10,
    width: 10,
    backgroundColor: '#FE5200',
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 10,
  },
  clickvideo: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FE5200',
    borderRadius: 100,
    alignSelf: 'center',
  },
  tickCamera: {
    height: 70,
    width: 70,
    backgroundColor: '#FE5200',
    borderRadius: 100,
    alignSelf: 'center',
  },
  stopvideo: {
    height: 30,
    width: 30,
    backgroundColor: '#FE5200',
    alignSelf: 'center',
  },
  viewfeature: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  switchCamera: {
    backgroundColor: '#FEC7AD',
    padding: 15,
    borderRadius: 100,
  },
  cutCamera: {
    backgroundColor: 'rgba(0,0,0,0)',
    padding: 15,
    borderRadius: 100,
  },
});

export default CameraView;
