variable Selection_Icon="Default_BARifle/Selection_Button.png";
variable Clip_BG="Default_BARifle/Clip_BG.png";
variable Clip_BG_Reloading="Default_BARifle/Clip_BG_Reloading.png";
variable Scope_Pic="Default_BARifle/Scope.png";
variable Bullet_Icon="Default_BARifle/Bullet.png";
variable Item_Model="Default_BARifle/BARifle.kv6";
variable Bullet_Model="Default_BARifle/BARifle_Bullet.kv6";
variable ShotSound="Default_BARifle/Shot.ogg";
variable AmmoCounterScript="System/ammo_counter.sl";
variable ScopeScript="System/scope.sl";

variable Scope_XSize=.3, Scope_YSize=.3;

define Default_BARifle_DamageString(this, player, bodypart){
	variable partname = bodypart.name;
	if(bodypart.name=="Head")
		return "headshot"asd;
	return sprintf("shot %S", bodypart.name);
}

variable Default_BARifle_t=@Item_t;
variable Default_BARifleType=@ItemType_t;
Default_BARifleType.name="Default_BoltActionRifle";
Default_BARifleType.display_name="Bolt-action rifle";
Default_BARifleType.use_delay=2000;
Default_BARifleType.maxamount1=10;
Default_BARifleType.maxamount2=50;
Default_BARifleType.reload_delay=2500;
Default_BARifleType.clip_reload=1;
Default_BARifleType.spread_c=.000001; Default_BARifleType.spread_m=.00001;
Default_BARifleType.recoil_xc=.1; Default_BARifleType.recoil_xm=.1;
Default_BARifleType.recoil_yc=-5.0; Default_BARifleType.recoil_ym=-2.0;
Default_BARifleType.block_damage=256/4;
Default_BARifleType.use_range=128;
Default_BARifleType.power=1.0;
Default_BARifleType.damage=100.0;
Default_BARifleType.pierce=1.0;
Default_BARifleType.is_weapon=1;
Default_BARifleType.repeated_use=1;
Default_BARifleType.model_path=Item_Model;
Default_BARifleType.bullet_model_path=Bullet_Model;
Default_BARifleType.use_sound_path=ShotSound;
Default_BARifleType.Instance_Type=&Default_BARifle_t;
Default_BARifleType.selection_icon=Selection_Icon;
Default_BARifleType.Get_Damage_Type_String=&Default_BARifle_DamageString;
Default_BARifleType.ammo_counter=struct{script=AmmoCounterScript, clip_bg_pic=Clip_BG, clip_reloading_pic=Clip_BG_Reloading, bullet_icon_pic=Bullet_Icon, ysize=.4};
Default_BARifleType.scope=struct{script=ScopeScript, pic=Scope_Pic, xsize=.3, ysize=.3};

%comment
variable ModuleData=struct{
	File_Requirements=[Selection_Icon, Clip_BG, Clip_BG_Reloading, Scope_Pic, Bullet_Icon, Item_Model, Bullet_Model, ShotSound],
	Defined_Items={Default_BARifleType=struct{something}}
};
