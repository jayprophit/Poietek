#[cfg(feature = "ring-ffi")]
mod ring_ffi {
    use std::ffi::c_void;
    use std::ptr;

    #[repr(C)]
    struct NativeTelemetry {
        processed_frames: u64,
        clipped_samples: u64,
        peak_absolute: f32,
    }

    #[link(name = "poietek_native_core", kind = "static")]
    extern "C" {
        fn poietek_ring_create(capacity_pow2: u32) -> *mut c_void;
        fn poietek_ring_free(ring: *mut c_void);
        fn poietek_ring_push_f32(ring: *mut c_void, value: f32) -> i32;
        fn poietek_ring_pop_f32(ring: *mut c_void, out: *mut f32) -> i32;
    }

    pub fn test_ring_ffi() -> bool {
        unsafe {
            let ring = poietek_ring_create(16);
            if ring.is_null() { return false; }
            let mut ok = true;
            for i in 0..8 {
                let r = poietek_ring_push_f32(ring, i as f32 + 0.5);
                if r == 0 { ok = false; break; }
            }
            for i in 0..8 {
                let mut out: f32 = 0.0;
                let r = poietek_ring_pop_f32(ring, &mut out as *mut f32);
                if r == 0 { ok = false; break; }
                if out != i as f32 + 0.5 { ok = false; break; }
            }
            poietek_ring_free(ring);
            ok
        }
    }
}
