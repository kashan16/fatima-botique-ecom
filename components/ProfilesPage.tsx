'use client';

import { useAddresses } from '@/hooks/useAddresses';
import { useProfile } from '@/hooks/useProfile';
import { Address, AddressType, CreateAddressInput } from '@/types';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ShadCN Components
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Calendar,
  Check,
  Edit2,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import Image from 'next/image';

export default function ProfilesPage() {
  //Hooks
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
    fetchProfile,
  } = useProfile();

  const {
    addresses,
    loading: addressesLoading,
    error: addressesError,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    refresh: refreshAddresses,
  } = useAddresses();
    
  // Local UI state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', phone_number: '' });
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<CreateAddressInput>({
    full_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    address_type: 'both',
    is_default: false,
  });

  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  const [isUpdatingAddress, setIsUpdatingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  useEffect(() => {
    if(profile) {
      setProfileForm({
        username: profile.username ?? '',
        phone_number: profile.phone_number ?? '',
      });
    }
  }, [profile]);

  // Helpers
  const validateProfileData = (data: { username?: string; phone_number?: string }) => {
    const errors: string[] = [];
    if (data.username && (data.username.length < 3 || data.username.length > 30)) {
      errors.push('Username must be 3-30 characters');
    }
    if (data.username && !/^[A-Za-z0-9_]+$/.test(data.username)) {
      errors.push('Username may contain only letters, numbers and underscores');
    }
    if (data.phone_number) {
      const digits = data.phone_number.replace(/\D/g, '');
      if (!/^[6-9]\d{9}$/.test(digits)) {
        errors.push('Phone number must be 10 digits and start with 6/7/8/9');
      }
    }
    return { isValid: errors.length === 0, errors };
  };

  const validateAddress = (data: Partial<CreateAddressInput>) => {
    const errors: string[] = [];
    if (!data.full_name || data.full_name.trim() === '') errors.push('Full name is required');
    if (!data.phone_number || data.phone_number.trim() === '') errors.push('Phone number is required');
    if (!data.address_line1 || data.address_line1.trim() === '') errors.push('Address line 1 is required');
    if (!data.city || data.city.trim() === '') errors.push('City is required');
    if (!data.state || data.state.trim() === '') errors.push('State is required');
    if (!data.pincode || !/^\d{4,6}$/.test(data.pincode)) errors.push('Pincode is required (4-6 digits)');
    if (!data.address_type) errors.push('Address type is required');
    return { isValid: errors.length === 0, errors };
  };

  // Profile actions
  const handleProfileEditStart = () => {
    setProfileForm({
      username: profile?.username ?? '',
      phone_number: profile?.phone_number ?? '',
    });
    setIsEditingProfile(true);
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfileForm({
      username: profile?.username ?? '',
      phone_number: profile?.phone_number ?? '',
    });
  };
    
  const handleProfileSave = async () => {
    const validation = validateProfileData(profileForm);
    if (!validation.isValid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    try {
      setIsProfileSaving(true);
      await updateProfile({
        username: profileForm.username || null,
        phone_number: profileForm.phone_number || null,
      });
      toast.success('Profile updated');
      setIsEditingProfile(false);
      await fetchProfile();
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error('Failed to update profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Address actions
  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      full_name: '',
      phone_number: '',
      address_line1: '',
      address_line2: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      address_type: 'both',
      is_default: false,
    });
    setIsAddressDialogOpen(true);
  };

  const handleEditAddress = (id: string) => {
    const addr = addresses.find(a => a.id === id);
    if (!addr) return;
    setEditingAddressId(id);
    setAddressForm({
      full_name: addr.full_name,
      phone_number: addr.phone_number,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || '',
      landmark: addr.landmark || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      address_type: addr.address_type,
      is_default: addr.is_default,
    });
    setIsAddressDialogOpen(true);
  };

  const handleAddressSubmit = async () => {
    const validation = validateAddress(addressForm);
    if (!validation.isValid) {
      toast.error(`Validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    try {
      if (editingAddressId) {
        setIsUpdatingAddress(true);
        await updateAddress(editingAddressId, addressForm);
        toast.success('Address updated');
      } else {
        setIsCreatingAddress(true);
        await createAddress(addressForm);
        toast.success('Address created');
      }
      setIsAddressDialogOpen(false);
      await refreshAddresses();
    } catch (err) {
      console.error('Address save failed', err);
      toast.error('Failed to save address');
    } finally {
      setIsCreatingAddress(false);
      setIsUpdatingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      setIsDeletingAddress(true);
      await deleteAddress(id);
      toast.success('Address deleted');
      await refreshAddresses();
    } catch (err) {
      console.error('Failed to delete address', err);
      toast.error('Failed to delete address');
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setIsUpdatingAddress(true);
      await setDefaultAddress(id);
      toast.success('Default address updated');
      await refreshAddresses();
    } catch (err) {
      console.error('Failed to set default', err);
      toast.error('Failed to set default address');
    } finally {
      setIsUpdatingAddress(false);
    }
  };

  // Loading UI
  if (profileLoading || addressesLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <div className="flex flex-col gap-8">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 lg:col-span-1" />
            <Skeleton className="h-64 lg:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  // mergedProfile approximation
  const mergedProfile = {
    full_name: profile?.username ?? '',
    email: undefined,
    phone_number: profile?.phone_number ?? undefined,
    created_at: profile?.created_at ?? undefined,
    has_complete_profile: Boolean(profile?.username && profile?.phone_number),
    missing_fields: [
      ...(profile?.username ? [] : ['username']),
      ...(profile?.phone_number ? [] : ['phone_number']),
    ],
    profile_image_url: undefined,
  };

  const defaultAddress = addresses.find(a => a.is_default) ?? null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 font-sans">My Profile</h1>
        <p className="text-gray-700 mt-2">Manage your personal information and addresses</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-white/80 backdrop-blur-sm">
          <TabsTrigger value="profile" className="font-sans">
            <User className="w-4 h-4 mr-2" />
            Profile Info
          </TabsTrigger>
          <TabsTrigger value="addresses" className="font-sans">
            <MapPin className="w-4 h-4 mr-2" />
            Addresses ({addresses.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200/50 rounded-full flex items-center justify-center overflow-hidden">
                    {mergedProfile.profile_image_url ? (
                      <Image
                        width={64}
                        height={64}
                        src={mergedProfile.profile_image_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {mergedProfile.full_name || 'User'}
                    </h3>
                    <p className="text-sm text-gray-700">Member</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{mergedProfile.email ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">{mergedProfile.phone_number ?? 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">
                      Joined {mergedProfile.created_at ? new Date(mergedProfile.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                {!mergedProfile.has_complete_profile && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-800 text-sm font-medium">
                        Complete your profile
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Account Details</CardTitle>
                  {!isEditingProfile ? (
                    <Button onClick={handleProfileEditStart} variant="outline" size="sm" className="border-gray-300">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleProfileSave} size="sm" className="bg-gray-800 hover:bg-gray-700" disabled={isProfileSaving}>
                        {isProfileSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Save
                      </Button>
                      <Button onClick={handleProfileCancel} variant="outline" size="sm" className="border-gray-300" disabled={isProfileSaving}>Cancel</Button>
                    </div>
                  )}
                </div>
                <CardDescription>Update your personal information and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-700">Username</Label>
                    <Input id="username" value={isEditingProfile ? profileForm.username : profile?.username ?? 'Not set'} onChange={(e) => setProfileForm({...profileForm, username: e.target.value})} disabled={!isEditingProfile || profileLoading} placeholder="Enter your username" className="mt-1 bg-white/50 backdrop-blur-sm" />
                    {isEditingProfile && <p className="text-xs text-gray-600">Username must be 3-30 characters, letters, numbers, and underscores only</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                    <Input id="phone" value={isEditingProfile ? profileForm.phone_number : profile?.phone_number ?? 'Not set'} onChange={(e) => setProfileForm({...profileForm, phone_number: e.target.value})} disabled={!isEditingProfile || profileLoading} placeholder="Enter your phone number" className="mt-1 bg-white/50 backdrop-blur-sm" />
                    {isEditingProfile && <p className="text-xs text-gray-600">10 digits, must start with 6,7,8, or 9</p>}
                  </div>
                </div>

                {profileError && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800 text-sm font-medium">{profileError}</p></div>}

                {mergedProfile.missing_fields && mergedProfile.missing_fields.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <p className="text-yellow-800 text-sm font-medium">Profile Incomplete</p>
                    </div>
                    <p className="text-yellow-700 text-sm">Please complete your profile by adding: {mergedProfile.missing_fields.join(', ')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Addresses</CardTitle>
                  <CardDescription>Manage your shipping and billing addresses</CardDescription>
                </div>
                <div>
                  <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleOpenAddAddress} className="bg-gray-800 hover:bg-gray-700"><Plus className="w-4 h-4 mr-2" /> Add New Address</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white/90 backdrop-blur-sm">
                      <DialogHeader><DialogTitle>{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle></DialogHeader>
                      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                        {/* Form inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name *</Label>
                            <Input id="full_name" value={addressForm.full_name} onChange={(e) => setAddressForm({...addressForm, full_name: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input id="phone" value={addressForm.phone_number} onChange={(e) => setAddressForm({...addressForm, phone_number: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address_line1">Address Line 1 *</Label>
                          <Input id="address_line1" value={addressForm.address_line1} onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address_line2">Address Line 2</Label>
                          <Input id="address_line2" value={addressForm.address_line2} onChange={(e) => setAddressForm({...addressForm, address_line2: e.target.value})} disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="landmark">Landmark</Label>
                          <Input id="landmark" value={addressForm.landmark} onChange={(e) => setAddressForm({...addressForm, landmark: e.target.value})} disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input id="city" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Input id="state" value={addressForm.state} onChange={(e) => setAddressForm({...addressForm, state: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode *</Label>
                            <Input id="pincode" value={addressForm.pincode} onChange={(e) => setAddressForm({...addressForm, pincode: e.target.value})} required disabled={isCreatingAddress || isUpdatingAddress} className="bg-white/50 backdrop-blur-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="address_type">Address Type</Label>
                            <Select value={addressForm.address_type} onValueChange={(value: AddressType) => setAddressForm({...addressForm, address_type: value})} disabled={isCreatingAddress || isUpdatingAddress}>
                              <SelectTrigger className="bg-white/50 backdrop-blur-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="both">Both (Shipping & Billing)</SelectItem>
                                <SelectItem value="shipping">Shipping Only</SelectItem>
                                <SelectItem value="billing">Billing Only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 pt-8">
                            <input type="checkbox" id="is_default" checked={addressForm.is_default} onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})} className="rounded border-gray-300" disabled={isCreatingAddress || isUpdatingAddress} />
                            <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button onClick={handleAddressSubmit} disabled={isCreatingAddress || isUpdatingAddress} className="flex-1 bg-gray-800 hover:bg-gray-700">
                            {(isCreatingAddress || isUpdatingAddress) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} {editingAddressId ? 'Update' : 'Save'} Address
                          </Button>
                          <Button onClick={() => setIsAddressDialogOpen(false)} variant="outline" className="border-gray-300" disabled={isCreatingAddress || isUpdatingAddress}>Cancel</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {addressesLoading ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
              ) : addresses.length === 0 ? (
                <Card className="p-12 text-center border-gray-200 bg-white/80 backdrop-blur-sm">
                  <Home className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2 font-sans">No Addresses Yet</h3>
                  <p className="text-gray-700 mb-6">Add your first address to make checkout faster</p>
                  <Button onClick={handleOpenAddAddress} className="bg-gray-800 hover:bg-gray-700"><Plus className="w-4 h-4 mr-2" /> Add Your First Address</Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {defaultAddress && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Default Address</h4>
                      <Card className="border-2 border-gray-800 bg-gray-50/80 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <AddressCard address={defaultAddress} onEdit={handleEditAddress} onDelete={handleDeleteAddress} onSetDefault={handleSetDefault} isUpdating={isUpdatingAddress} isDeleting={isDeletingAddress} isDefault />
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {addresses.filter(a => !a.is_default).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3">Other Addresses ({addresses.filter(a => !a.is_default).length})</h4>
                      <div className="space-y-4">
                        {addresses.filter(a => !a.is_default).map(address => (
                          <Card key={address.id} className="border-gray-200/50 bg-white/80 backdrop-blur-sm">
                            <CardContent className="p-4">
                              <AddressCard address={address} onEdit={handleEditAddress} onDelete={handleDeleteAddress} onSetDefault={handleSetDefault} isUpdating={isUpdatingAddress} isDeleting={isDeletingAddress} />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {addressesError && <div className="bg-red-50 border border-red-200 rounded-lg p-4"><p className="text-red-800 text-sm font-medium">{addressesError}</p></div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AddressCardProps {
  address: Address;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
  isDefault?: boolean;
}
function AddressCard({ address, onEdit, onDelete, onSetDefault, isUpdating, isDeleting, isDefault }: AddressCardProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-gray-800 font-sans">{address.full_name}</h4>
          {isDefault && <Badge className="bg-gray-800 text-white"><Check className="w-3 h-3 mr-1" />Default</Badge>}
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">{address.address_type.charAt(0).toUpperCase() + address.address_type.slice(1)}</Badge>
        </div>
        <div className="text-sm text-gray-700 space-y-1">
          <p className="flex items-center gap-2"><Phone className="w-4 h-4" />{address.phone_number}</p>
          <p>{address.address_line1}{address.address_line2 && `, ${address.address_line2}`}</p>
          {address.landmark && <p>Landmark: {address.landmark}</p>}
          <p>{address.city}, {address.state} - {address.pincode}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {!isDefault && <Button onClick={() => onSetDefault(address.id)} disabled={isUpdating} variant="outline" size="sm" className="border-gray-300">{isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Default'}</Button>}
        <Button onClick={() => onEdit(address.id)} variant="outline" size="sm" className="border-gray-300" disabled={isUpdating || isDeleting}><Edit2 className="w-4 h-4" /></Button>
        <Button onClick={() => onDelete(address.id)} disabled={isDeleting} variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</Button>
      </div>
    </div>
  );
}