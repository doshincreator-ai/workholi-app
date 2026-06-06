import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { AchievementsContent } from './achievements';
import { SettingsContent } from './settings';
import { Colors } from '../../src/constants/colors';
import { FontSize } from '../../src/constants/typography';
import { Spacing } from '../../src/constants/spacing';

export default function MyPageScreen() {
  const [activeTab, setActiveTab] = useState<'achievements' | 'settings'>('achievements');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topTabBar}>
        {(['achievements', 'settings'] as const).map((tab) => (
          <Pressable
            key={tab}
            style={[styles.topTab, activeTab === tab && styles.topTabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.topTabText, activeTab === tab && styles.topTabTextActive]}>
              {tab === 'achievements' ? '実績' : '設定'}
            </Text>
          </Pressable>
        ))}
      </View>
      {activeTab === 'achievements' ? (
        <AchievementsContent />
      ) : (
        <SettingsContent />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabActive: {
    borderBottomColor: Colors.primary,
  },
  topTabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  topTabTextActive: {
    color: Colors.primary,
  },
});
