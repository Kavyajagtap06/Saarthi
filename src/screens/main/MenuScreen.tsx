// src/screens/MenuScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SOSFab from '../../components/SOSFab';

export default function MenuScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState(false);

  const menuItems = [
    {
      title: 'Navigation History',
      icon: 'time-outline',
    //   onPress: () => router.push('/navigation-history'),
    },
    {
      title: 'Saved Locations',
      icon: 'bookmark-outline',
    //   onPress: () => router.push('/saved-locations'),
    },
    {
      title: 'Route Preferences',
      icon: 'options-outline',
    //   onPress: () => router.push('/route-preferences'),
    },
    {
      title: 'Vehicle Settings',
      icon: 'car-outline',
    //   onPress: () => router.push('/vehicle-settings'),
    },
  ];

  const supportItems = [
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
    //   onPress: () => router.push('/help'),
    },
    {
      title: 'About',
      icon: 'information-circle-outline',
    //   onPress: () => router.push('/about'),
    },
    {
      title: 'Rate App',
      icon: 'star-outline',
      onPress: () => Alert.alert('Rate App', 'Thank you for your feedback!'),
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            // Handle logout logic here
            Alert.alert('Logged out', 'You have been successfully logged out.');
          }
        },
      ]
    );
  };

  const MenuSection = ({ title, items }: { title: string; items: any[] }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={22} color="#666" />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Menu</Text>
          <Text style={styles.headerSubtitle}>App Settings & Preferences</Text>
        </View>

        {/* Quick Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="notifications-outline" size={22} color="#666" />
                <Text style={styles.settingItemText}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#f0f0f0', true: '#007bff' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <Ionicons name="moon-outline" size={22} color="#666" />
                <Text style={styles.settingItemText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#f0f0f0', true: '#007bff' }}
                thumbColor={darkModeEnabled ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Navigation */}
        <MenuSection title="Navigation" items={menuItems} />

        {/* Support */}
        <MenuSection title="Support" items={supportItems} />

        {/* App Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.sectionContent}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Version</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Build Number</Text>
              <Text style={styles.infoValue}>12345</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>Jan 15, 2024</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Saarthi</Text>
        </View>
      </ScrollView>
      <SOSFab />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
    backgroundColor:'rgba(255, 238, 251, 1)',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#680d3fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#680d3fff',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b1757ff',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});