import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { COLORS } from '../constants/colors';
import { CONFIG } from '../constants/config';

interface MessageProps {
  message: string;
  attachmentUrl?: string | null;
  isRead: boolean;
  isSelf: boolean;
  timestamp: string;
  senderName: string;
}

const { width, height } = Dimensions.get('window');

export default function GrievanceBubble({ 
  message, attachmentUrl, isRead, isSelf, timestamp, senderName 
}: MessageProps) {
  
  const [modalVisible, setModalVisible] = useState(false);

  const formattedTime = () => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${CONFIG.API_BASE_URL}${url}`;
    return `${CONFIG.API_BASE_URL}/media/${url}`;
  };

  return (
    <View style={[styles.wrapper, isSelf ? styles.alignRight : styles.alignLeft]}>
      {/* Sender Name for incoming messages */}
      {!isSelf && <Text style={styles.senderText}>{senderName}</Text>}
      
      <View style={[
        styles.bubble,
        isSelf ? styles.selfBubble : styles.otherBubble
      ]}>
        {/* Attachment Image */}
        {attachmentUrl ? (
          <>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image 
                source={{ uri: getImageUrl(attachmentUrl) }} 
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
            
            <Modal
              visible={modalVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <SafeAreaView style={styles.modalSafeArea}>
                  <TouchableOpacity 
                    style={styles.closeBtn} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.closeBtnText}>✕ Close</Text>
                  </TouchableOpacity>
                  <Image 
                    source={{ uri: getImageUrl(attachmentUrl) }} 
                    style={styles.fullScreenImage}
                    resizeMode="contain"
                  />
                </SafeAreaView>
              </View>
            </Modal>
          </>
        ) : null}

        {/* Message Text */}
        {message ? (
          <Text style={[styles.messageText, isSelf ? styles.selfText : styles.otherText]}>
            {message}
          </Text>
        ) : null}

        {/* Time and Tick Status */}
        <View style={styles.footer}>
          <Text style={[styles.timeText, isSelf ? styles.selfTimeText : styles.otherTimeText]}>
            {formattedTime()}
          </Text>
          {isSelf && (
            <Text style={styles.tickText}>
              {isRead ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    paddingHorizontal: 12,
    maxWidth: '85%',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  senderText: {
    fontSize: 10,
    color: COLORS.lightText,
    marginBottom: 2,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  bubble: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
    elevation: 1,
  },
  selfBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: COLORS.secondary,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.primary + '11',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  selfText: {
    color: '#ffffff',
  },
  otherText: {
    color: COLORS.darkText,
  },
  image: {
    width: width * 0.6,
    height: width * 0.4,
    borderRadius: 8,
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
  },
  selfTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: COLORS.lightText,
  },
  tickText: {
    fontSize: 10,
    color: '#a8dba8', // light green tick
    marginLeft: 4,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSafeArea: {
    flex: 1,
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
