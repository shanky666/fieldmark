import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');

export default function GrievanceBubble({ 
  message, attachmentUrl, isRead, isSelf, timestamp, senderName 
}: MessageProps) {
  
  const formattedTime = () => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
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
          <Image 
            source={{ uri: attachmentUrl.startsWith('http') ? attachmentUrl : `${CONFIG.API_BASE_URL}/media/${attachmentUrl}` }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}

        {/* Message Text */}
        <Text style={[styles.messageText, isSelf ? styles.selfText : styles.otherText]}>
          {message}
        </Text>

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
});
