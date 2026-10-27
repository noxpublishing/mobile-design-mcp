import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReadingItem } from './readingItems.ts';
import { serif, type StudyTheme } from './theme.ts';

export function ArticleDetail({ item, read, close, toggle, reduced, theme }: {
  item: ReadingItem | undefined; read: boolean; close: () => void; toggle: () => void;
  reduced: boolean; theme: StudyTheme;
}) {
  return <Modal visible={!!item} presentationStyle="pageSheet" animationType={reduced ? 'none' : 'slide'} onRequestClose={close}>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.paper }}>
      <View style={[styles.toolbar, { borderBottomColor: theme.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close note" testID="close-note" onPress={close} style={styles.action}>
          <Text style={{ color: theme.accent, fontSize: 17, fontWeight: '600' }}>Done</Text>
        </Pressable>
        <Text style={{ color: theme.muted, fontSize: 15 }}>Folio · Original study notes</Text>
      </View>
      {item && <ScrollView contentContainerStyle={styles.body}>
        <Text style={{ color: theme.muted, fontSize: 16 }}>{item.category}</Text>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.ink }]}>{item.title}</Text>
        {item.body.map(paragraph => <Text key={paragraph} style={[styles.paragraph, { color: theme.ink }]}>{paragraph}</Text>)}
        <Pressable accessibilityRole="button" testID="toggle-read" onPress={toggle} style={[styles.complete, { backgroundColor: theme.accent }]}>
          <Text style={{ color: theme.onAccent, fontSize: 17, fontWeight: '600' }}>{read ? 'Mark as unread' : 'Mark as read'}</Text>
        </Pressable>
        <Text accessibilityLiveRegion="polite" style={{ color: theme.muted, fontSize: 16 }}>{read ? 'Read. You can change this or undo it in your queue.' : 'Unread. Your place in the queue stays the same.'}</Text>
      </ScrollView>}
    </SafeAreaView>
  </Modal>;
}

const styles = StyleSheet.create({
  toolbar: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  action: { minHeight: 44, minWidth: 52, justifyContent: 'center' },
  body: { padding: 24, paddingBottom: 48, gap: 20 },
  title: { fontFamily: serif, fontSize: 36, lineHeight: 43, marginBottom: 12 },
  paragraph: { fontFamily: serif, fontSize: 20, lineHeight: 31 },
  complete: { minHeight: 52, padding: 16, alignItems: 'center', borderRadius: 8, marginTop: 8 },
});
